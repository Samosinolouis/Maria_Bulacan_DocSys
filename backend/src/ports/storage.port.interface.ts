/**
 * Object Storage Port Interface (MinIO)
 *
 * Abstracts object storage so the application never depends on a specific
 * provider SDK. [SOLID:DIP] Services depend on this interface, not on MinIO.
 *
 * [NFR-06] MinIO access uses application-scoped credentials server-side only;
 * downloads are delivered via short-lived presigned URLs.
 * [NFR-08] Every uploaded file carries a server-computed SHA-256 checksum.
 * NOTE: Storage is NOT transactional - it is a side effect, never inside a UoW.
 */

/** Input for uploading a single object (upload-only - the app never generates). */
export interface UploadObjectInput {
  /** MinIO object key (storage path). Caller builds deterministic keys. */
  key: string;
  /** Raw file bytes as received from the client. */
  body: Buffer | Uint8Array;
  /** MIME type (must be whitelisted before calling). */
  contentType: string;
  /** Original filename as uploaded by the user. */
  originalName: string;
  /** Optional custom metadata stored alongside the object. */
  metadata?: Record<string, string>;
}

/** Result of a successful upload. */
export interface StoredObject {
  /** MinIO object key. */
  key: string;
  /** Bucket the object was written to. */
  bucketName: string;
  /** Object size in bytes. */
  sizeBytes: number;
  /** Server-computed SHA-256 checksum (hex) - tamper-evidence. */
  checksum: string;
  /** Server time the object was stored. */
  uploadTimestamp: Date;
}

/** Options for generating a short-lived download URL. */
export interface PresignOptions {
  /** Lifetime of the URL in seconds. Defaults to config.minio.presignExpirySeconds. */
  expiresInSeconds?: number;
  /** Suggested download filename (Content-Disposition). */
  fileName?: string;
  /** true = inline preview (FR-34); false or omitted = attachment download. */
  inline?: boolean;
}

/** Object Storage Port Contract. */
export interface IObjectStoragePort {
  /** Bucket this port writes to. */
  readonly bucketName: string;

  /**
   * Upload raw bytes to storage. Returns the stored object metadata
   * including the server-computed SHA-256 checksum.
   */
  uploadObject(input: UploadObjectInput): Promise<StoredObject>;

  /**
   * Generate a short-lived presigned GET URL for secure download
   * (inline PDF preview + offline download, FR-34).
   */
  getPresignedDownloadUrl(
    key: string,
    options?: PresignOptions,
  ): Promise<string>;

  /** Check whether an object exists (checksum reconciliation, NFR-15). */
  objectExists(key: string): Promise<boolean>;

  /** Delete an object. Used only by retention/reconciliation jobs. */
  deleteObject(key: string): Promise<void>;
}
