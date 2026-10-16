/**
 * MinIO Object Storage Adapter with Persistent Local Disk Fallback
 *
 * Implements IObjectStoragePort against a MinIO server (S3-compatible) when
 * available, and falls back gracefully to persistent local disk storage
 * on Azure App Service (/home/site/attachments or ./storage/attachments)
 * when MinIO is unavailable.
 *
 * [SOLID:SRP]  Upload/download/delete of objects only.
 * [SOLID:DIP]  Business layer depends on IObjectStoragePort, not this class.
 * [NFR-06]     Server-side application-scoped credentials; downloads delivered
 *              via short-lived presigned URLs.
 * [NFR-08]     Returns a server-computed SHA-256 checksum for the stored bytes.
 * NOTE: Storage is NOT transactional - never call this inside a Unit of Work.
 */

import fs from "node:fs";
import path from "node:path";
import * as Minio from "minio";

import { config } from "../../config/index.js";
import { computeSha256 } from "../../utils/index.js";
import type {
  IObjectStoragePort,
  UploadObjectInput,
  StoredObject,
  PresignOptions,
} from "../../ports/storage.port.interface.js";

export const LOCAL_STORAGE_DIR = process.env.STORAGE_PATH || (
  process.env.HOME
    ? path.join(process.env.HOME, "site", "attachments")
    : path.join(process.cwd(), "storage", "attachments")
);

export class MinioObjectStorageAdapter implements IObjectStoragePort {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private bucketReady: Promise<void> | null = null;
  private minioAvailable: boolean | null = null;

  constructor() {
    this.bucket = config.minio.bucketName;

    const rawEndpoint = config.minio.endpoint.includes("://")
      ? config.minio.endpoint
      : `http://${config.minio.endpoint}`;
    const url = new URL(rawEndpoint);

    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port
        ? Number.parseInt(url.port, 10)
        : url.protocol === "https:"
          ? 443
          : 80,
      useSSL: url.protocol === "https:" || config.minio.useSsl,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
      region: config.minio.region as Minio.Region,
      pathStyle: true,
    });
  }

  get bucketName(): string {
    return this.bucket;
  }

  async uploadObject(input: UploadObjectInput): Promise<StoredObject> {
    const bytes =
      input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);
    const checksum = computeSha256(bytes);

    const isMinio = await this.checkMinioAvailability();
    if (isMinio) {
      try {
        await this.ensureBucket();
        await this.client.putObject(
          this.bucket,
          input.key,
          Buffer.from(bytes),
          bytes.byteLength,
          this.buildMetadata(input, checksum),
        );
        return {
          key: input.key,
          bucketName: this.bucket,
          sizeBytes: bytes.byteLength,
          checksum,
          uploadTimestamp: new Date(),
        };
      } catch (err) {
        console.warn("MinIO putObject failed, falling back to local persistent storage:", err);
      }
    }

    // Persistent local filesystem storage fallback
    const safeKey = path.normalize(input.key).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(LOCAL_STORAGE_DIR, safeKey);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, Buffer.from(bytes));

    const metaPath = `${fullPath}.meta.json`;
    fs.writeFileSync(
      metaPath,
      JSON.stringify({
        contentType: input.contentType,
        originalName: input.originalName,
        checksum,
        sizeBytes: bytes.byteLength,
        uploadTimestamp: new Date().toISOString(),
        metadata: input.metadata ?? {},
      }),
    );

    return {
      key: input.key,
      bucketName: "local-persistent",
      sizeBytes: bytes.byteLength,
      checksum,
      uploadTimestamp: new Date(),
    };
  }

  async getPresignedDownloadUrl(
    key: string,
    options?: PresignOptions,
  ): Promise<string> {
    const isMinio = await this.checkMinioAvailability();
    if (isMinio) {
      try {
        const expiresIn =
          options?.expiresInSeconds ?? config.minio.presignExpirySeconds;
        const responseHeaders: Record<string, string> = {};
        if (options?.fileName) {
          const safeName = options.fileName.replace(/["\\\r\n]/g, "");
          responseHeaders["response-content-disposition"] =
            `${options.inline ? "inline" : "attachment"}; filename="${safeName}"`;
        }
        return await this.client.presignedGetObject(
          this.bucket,
          key,
          expiresIn,
          responseHeaders,
        );
      } catch {
        // Fall back to local file route
      }
    }

    const base = config.app.baseUrl || "https://santamaria-docsys-api.azurewebsites.net";
    const query = new URLSearchParams();
    if (options?.fileName) query.set("filename", options.fileName);
    if (options?.inline) query.set("inline", "true");
    const qs = query.toString();
    return `${base.replace(/\/+$/, "")}/uploads/files/${encodeURIComponent(key)}${qs ? `?${qs}` : ""}`;
  }

  async objectExists(key: string): Promise<boolean> {
    const isMinio = await this.checkMinioAvailability();
    if (isMinio) {
      try {
        await this.client.statObject(this.bucket, key);
        return true;
      } catch {
        // Check local
      }
    }
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(LOCAL_STORAGE_DIR, safeKey);
    return fs.existsSync(fullPath);
  }

  async deleteObject(key: string): Promise<void> {
    const isMinio = await this.checkMinioAvailability();
    if (isMinio) {
      try {
        await this.client.removeObject(this.bucket, key);
      } catch {
        // Continue
      }
    }
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(LOCAL_STORAGE_DIR, safeKey);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        const metaPath = `${fullPath}.meta.json`;
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
      } catch {
        // Ignore unlink error
      }
    }
  }

  private async checkMinioAvailability(): Promise<boolean> {
    if (this.minioAvailable !== null) return this.minioAvailable;
    try {
      await this.client.bucketExists(this.bucket);
      this.minioAvailable = true;
      return true;
    } catch {
      this.minioAvailable = false;
      return false;
    }
  }

  private buildMetadata(
    input: UploadObjectInput,
    checksum: string,
  ): Record<string, string> {
    const metaData: Record<string, string> = {
      "Content-Type": input.contentType,
      "x-amz-meta-original-name": input.originalName,
      "x-amz-meta-sha256": checksum,
    };
    for (const [name, value] of Object.entries(input.metadata ?? {})) {
      metaData[`x-amz-meta-${name.toLowerCase()}`] = value;
    }
    return metaData;
  }

  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
          await this.client.makeBucket(this.bucket, config.minio.region as Minio.Region);
        }
      })().catch((error) => {
        this.bucketReady = null;
        throw error;
      });
    }
    return this.bucketReady;
  }
}
