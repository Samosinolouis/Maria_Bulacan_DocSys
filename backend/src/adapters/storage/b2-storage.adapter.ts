/**
 * Backblaze B2 Object Storage Adapter
 *
 * Implements IObjectStoragePort against Backblaze B2's S3-compatible API.
 *
 * [SOLID:SRP]  Upload/download/delete of objects only.
 * [SOLID:DIP]  Business layer depends on IObjectStoragePort, not this class.
 * [NFR-06]     Server-side application-scoped credentials; downloads delivered
 *              via short-lived presigned URLs.
 * [NFR-08]     Returns a server-computed SHA-256 checksum for the stored bytes.
 * NOTE: Storage is NOT transactional — never call this inside a Unit of Work.
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "../../config/index.js";
import { computeSha256 } from "../../utils/index.js";
import { AppError, CommonErrorCode } from "../../errors/index.js";
import type {
  IObjectStoragePort,
  UploadObjectInput,
  StoredObject,
  PresignOptions,
} from "../../ports/storage.port.interface.js";

export class B2ObjectStorageAdapter implements IObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = config.b2.bucketName;
    this.client = new S3Client({
      region: config.b2.region,
      endpoint: config.b2.endpoint,
      // Backblaze B2 S3 API requires path-style addressing.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.b2.applicationKeyId,
        secretAccessKey: config.b2.applicationKey,
      },
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

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.key,
          Body: bytes,
          ContentType: input.contentType,
          Metadata: {
            ...input.metadata,
            "original-name": input.originalName,
            "sha256": checksum,
          },
        }),
      );
    } catch (error) {
      throw new AppError("Failed to store object in B2", {
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
    const expiresIn = options?.expiresInSeconds ?? config.b2.presignExpirySeconds;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options?.fileName && {
        ResponseContentDisposition: `attachment; filename="${options.fileName}"`,
      }),
    });

    try {
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      throw new AppError("Failed to presign B2 download URL", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
        details: { key, reason: (error as Error).message },
      });
    }
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      throw new AppError("Failed to delete object from B2", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
        details: { key, reason: (error as Error).message },
      });
    }
  }
}
