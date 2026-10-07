/**
 * MinIO Object Storage Adapter
 *
 * Implements IObjectStoragePort against a MinIO server (S3-compatible) using
 * the official MinIO JavaScript client. This is THE object storage for the
 * system: every uploaded file (incoming scans, annexes, drafts, transmission
 * proofs, signed finals) lives here.
 *
 * [SOLID:SRP]  Upload/download/delete of objects only.
 * [SOLID:DIP]  Business layer depends on IObjectStoragePort, not this class.
 * [NFR-06]     Server-side application-scoped credentials; downloads delivered
 *              via short-lived presigned URLs.
 * [NFR-08]     Returns a server-computed SHA-256 checksum for the stored bytes.
 * NOTE: Storage is NOT transactional - never call this inside a Unit of Work.
 */

import * as Minio from "minio";

import { config } from "../../config/index.js";
import { computeSha256 } from "../../utils/index.js";
import { AppError, CommonErrorCode } from "../../errors/index.js";
import type {
  IObjectStoragePort,
  UploadObjectInput,
  StoredObject,
  PresignOptions,
} from "../../ports/storage.port.interface.js";

export class MinioObjectStorageAdapter implements IObjectStoragePort {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  /** Cached bucket-existence check; created lazily on the first upload. */
  private bucketReady: Promise<void> | null = null;

  constructor() {
    this.bucket = config.minio.bucketName;

    // MINIO_ENDPOINT may be a URL (http://host:port) or a bare host[:port].
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
      // MinIO serves the S3 API on path-style addressing.
      pathStyle: true,
    });
  }

  get bucketName(): string {
    return this.bucket;
  }

  async uploadObject(input: UploadObjectInput): Promise<StoredObject> {
    const bytes =
      input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);

    // Server-computed tamper-evidence checksum (NFR-08).
    const checksum = computeSha256(bytes);
    await this.ensureBucket();

    try {
      await this.client.putObject(
        this.bucket,
        input.key,
        Buffer.from(bytes),
        bytes.byteLength,
        this.buildMetadata(input, checksum),
      );
    } catch (error) {
      throw new AppError("Failed to store object in MinIO", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
        details: { key: input.key, reason: (error as Error).message },
      });
    }

    return {
      key: input.key,
      bucketName: this.bucket,
      sizeBytes: bytes.byteLength,
      checksum,
      uploadTimestamp: new Date(),
    };
  }

  async getPresignedDownloadUrl(
    key: string,
    options?: PresignOptions,
  ): Promise<string> {
    const expiresIn =
      options?.expiresInSeconds ?? config.minio.presignExpirySeconds;

    // Inline preview vs forced download (FR-34); the filename is sanitized so
    // it can never break the Content-Disposition header.
    const responseHeaders: Record<string, string> = {};
    if (options?.fileName) {
      const safeName = options.fileName.replace(/["\\\r\n]/g, "");
      responseHeaders["response-content-disposition"] =
        `${options.inline ? "inline" : "attachment"}; filename="${safeName}"`;
    }

    try {
      return await this.client.presignedGetObject(
        this.bucket,
        key,
        expiresIn,
        responseHeaders,
      );
    } catch (error) {
      throw new AppError("Failed to presign MinIO download URL", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
        details: { key, reason: (error as Error).message },
      });
    }
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (error) {
      throw new AppError("Failed to delete object from MinIO", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
        details: { key, reason: (error as Error).message },
      });
    }
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /**
   * Custom metadata travels as `x-amz-meta-*` headers: the original filename
   * and the SHA-256 checksum are always stored (NFR-08), caller metadata is
   * preserved alongside them.
   */
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

  /**
   * Ensure the bucket exists (cached, idempotent). The compose stack creates
   * it up front via the `minio-init` job; this covers bare MinIO instances.
   * A failed check is not cached, so the next upload retries.
   */
  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
          await this.client.makeBucket(this.bucket, config.minio.region as Minio.Region);
        }
      })().catch((error) => {
        this.bucketReady = null;
        throw new AppError("Failed to ensure MinIO bucket exists", {
          status: 502,
          code: CommonErrorCode.INTERNAL_ERROR,
          details: { bucket: this.bucket, reason: (error as Error).message },
        });
      });
    }
    return this.bucketReady;
  }
}
