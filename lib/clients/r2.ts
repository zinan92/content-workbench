/**
 * Cloudflare R2 Client Factory
 * 
 * Provides centralized S3-compatible client creation for R2 artifact storage.
 * 
 * CRITICAL: This client is SERVER ONLY and must never be exposed to browser context.
 * R2 credentials and operations must remain on the server.
 * 
 * USAGE RULES:
 * - Only use in API routes, Server Actions, Server Components, or background workers
 * - Never import or use in browser-side code
 * - Never expose bucket URLs or signed URLs with long expiry to untrusted clients
 * - Use presigned URLs with short expiry for browser downloads when needed
 * 
 * ARTIFACT STORAGE PATTERNS:
 * - Upload: Server receives file -> uploads to R2 -> stores metadata URL in Postgres
 * - Download: Server generates presigned URL -> returns to browser -> browser fetches from R2
 * - Never give browser direct write access to R2
 */

import {
  getR2AccountId,
  getR2BucketName,
  getR2CredentialId,
  getR2CredentialSecret,
} from '../config/env';

/**
 * R2 client interface
 * 
 * This is a placeholder for the actual AWS S3 client type from @aws-sdk/client-s3.
 * When @aws-sdk/client-s3 is installed, replace this with:
 *   import type { S3Client } from '@aws-sdk/client-s3'
 * 
 * For now, we define a minimal interface that documents the contract.
 */
export interface R2Client {
  // Upload operations
  putObject: (params: {
    Bucket: string;
    Key: string;
    Body: Buffer | ReadableStream;
    ContentType?: string;
  }) => Promise<unknown>;
  
  // Download operations
  getObject: (params: {
    Bucket: string;
    Key: string;
  }) => Promise<unknown>;
  
  // Signed URLs
  getSignedUrl: (
    command: string,
    params: { Bucket: string; Key: string },
    options: { expiresIn: number }
  ) => Promise<string>;
  
  // List operations
  listObjectsV2: (params: {
    Bucket: string;
    Prefix?: string;
  }) => Promise<unknown>;
  
  // Delete operations
  deleteObject: (params: {
    Bucket: string;
    Key: string;
  }) => Promise<unknown>;
}

/**
 * R2 configuration
 */
interface R2Config {
  accountId: string;
  bucketName: string;
  accessId: string;
  accessValue: string;
  endpoint: string;
}

/**
 * Get R2 configuration from environment
 */
function getR2Config(): R2Config {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access R2 configuration from browser context. ' +
      'R2 credentials must NEVER be exposed to the client.'
    );
  }
  
  // Retrieve configuration from environment module
  const accountId = getR2AccountId();
  const bucketName = getR2BucketName();
  // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  
  return {
    accountId,
    bucketName,
    accessId: getR2CredentialId(),
    accessValue: getR2CredentialSecret(),
    endpoint,
  };
}

/**
 * Create an R2 client for artifact storage
 * 
 * **CRITICAL: SERVER ONLY - NEVER expose to browser**
 * 
 * This client provides S3-compatible access to Cloudflare R2 for storing and
 * retrieving prepared artifacts (videos, transcripts, analysis, etc.).
 * 
 * WHEN TO USE:
 * - API routes that handle artifact uploads
 * - Background workers that prepare and store artifacts
 * - Server Actions that generate presigned download URLs
 * - Admin operations that manage stored artifacts
 * 
 * WHEN NOT TO USE:
 * - Browser-side components or hooks
 * - Client-side utilities
 * - Any code that could execute in browser context
 * 
 * @example
 * ```typescript
 * // app/api/artifacts/upload/route.ts (API Route - server only)
 * import { createR2Client } from '@/lib/clients/r2'
 * 
 * export async function POST(request: Request) {
 *   const r2 = createR2Client()
 *   
 *   // Upload artifact to R2
 *   await r2.putObject({
 *     Bucket: process.env.R2_BUCKET_NAME!,
 *     Key: `items/${itemId}/video.mp4`,
 *     Body: videoBuffer,
 *     ContentType: 'video/mp4',
 *   })
 *   
 *   // Store artifact URL in database
 *   const artifactUrl = `https://artifacts.example.com/items/${itemId}/video.mp4`
 *   // ... save to Postgres
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // app/api/artifacts/download-url/route.ts (API Route - server only)
 * import { createR2Client, generatePresignedDownloadUrl } from '@/lib/clients/r2'
 * 
 * export async function POST(request: Request) {
 *   const { artifactKey } = await request.json()
 *   
 *   // Generate short-lived presigned URL for browser download
 *   const downloadUrl = await generatePresignedDownloadUrl(artifactKey, 3600) // 1 hour
 *   
 *   return Response.json({ downloadUrl })
 * }
 * ```
 */
export function createR2Client(): R2Client {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to create R2 client from browser context. ' +
      'R2 clients must NEVER be used in browser code. ' +
      'Server must mediate all artifact storage operations.'
    );
  }
  
  const config = getR2Config();
  
  // TODO: Replace with actual S3 client creation when @aws-sdk/client-s3 is installed:
  // import { S3Client } from '@aws-sdk/client-s3'
  // 
  // return new S3Client({
  //   region: 'auto', // R2 uses 'auto' for region
  //   endpoint: config.endpoint,
  //   credentials: {
  //     accessKeyId: config.accessId,
  //     secretAccessKey: config.accessValue,
  //   },
  // }) as R2Client
  
  // Placeholder: throw clear error for now
  throw new Error(
    `R2 client factory called but @aws-sdk/client-s3 not yet installed.\n` +
    `Endpoint: ${config.endpoint}\n` +
    `Bucket: ${config.bucketName}\n` +
    `Access ID: ${config.accessId.substring(0, 10)}...\n` +
    `This is a migration scaffold - install AWS SDK when ready to implement artifact storage.`
  );
}

/**
 * Generate a presigned URL for downloading an artifact from R2
 * 
 * **SERVER ONLY** - Use this to create short-lived URLs that browsers can use to
 * download artifacts without exposing R2 credentials.
 * 
 * @param artifactKey - R2 object key (e.g., "items/abc123/video.mp4")
 * @param expiresIn - URL expiry in seconds (default: 1 hour, max recommended: 24 hours)
 * @returns Presigned URL that browser can use to download the artifact
 * 
 * @example
 * ```typescript
 * // Server-side only
 * const downloadUrl = await generatePresignedDownloadUrl(
 *   'items/abc123/video.mp4',
 *   3600 // 1 hour
 * )
 * // Return downloadUrl to browser for temporary access
 * ```
 */
export async function generatePresignedDownloadUrl(
  artifactKey: string,
  expiresIn = 3600
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to generate R2 presigned URL from browser context. ' +
      'Presigned URL generation must happen server-side only.'
    );
  }
  
  const config = getR2Config();
  
  // TODO: Replace with actual presigned URL generation when @aws-sdk/s3-request-presigner is installed:
  // import { GetObjectCommand } from '@aws-sdk/client-s3'
  // import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  // 
  // const client = createR2Client()
  // const command = new GetObjectCommand({
  //   Bucket: config.bucketName,
  //   Key: artifactKey,
  // })
  // 
  // return await getSignedUrl(client, command, { expiresIn })
  
  // Placeholder: throw clear error for now
  throw new Error(
    `generatePresignedDownloadUrl called but @aws-sdk/s3-request-presigner not yet installed.\n` +
    `Bucket: ${config.bucketName}\n` +
    `Key: ${artifactKey}\n` +
    `Expiry: ${expiresIn}s\n` +
    `This is a migration scaffold - install AWS SDK when ready to implement presigned URLs.`
  );
}

/**
 * Generate a presigned URL for uploading an artifact to R2
 * 
 * **SERVER ONLY** - Use this to create short-lived URLs that allow direct browser
 * uploads to R2 without proxying through your server.
 * 
 * NOTE: Consider security implications before using. For sensitive workflows,
 * prefer server-side upload (browser -> server -> R2) over direct upload.
 * 
 * @param artifactKey - R2 object key where artifact will be stored
 * @param expiresIn - URL expiry in seconds (default: 15 minutes for uploads)
 * @param contentType - Expected content type for the upload
 * @returns Presigned URL that browser can PUT to directly
 * 
 * @example
 * ```typescript
 * // Server-side only
 * const uploadUrl = await generatePresignedUploadUrl(
 *   'items/abc123/video.mp4',
 *   900, // 15 minutes
 *   'video/mp4'
 * )
 * // Return uploadUrl to browser for direct upload
 * ```
 */
export async function generatePresignedUploadUrl(
  artifactKey: string,
  expiresIn = 900,
  contentType?: string
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to generate R2 presigned upload URL from browser context. ' +
      'Presigned URL generation must happen server-side only.'
    );
  }
  
  const config = getR2Config();
  
  // TODO: Replace with actual presigned URL generation when @aws-sdk/s3-request-presigner is installed:
  // import { PutObjectCommand } from '@aws-sdk/client-s3'
  // import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  // 
  // const client = createR2Client()
  // const command = new PutObjectCommand({
  //   Bucket: config.bucketName,
  //   Key: artifactKey,
  //   ContentType: contentType,
  // })
  // 
  // return await getSignedUrl(client, command, { expiresIn })
  
  // Placeholder: throw clear error for now
  throw new Error(
    `generatePresignedUploadUrl called but @aws-sdk/s3-request-presigner not yet installed.\n` +
    `Bucket: ${config.bucketName}\n` +
    `Key: ${artifactKey}\n` +
    `Content-Type: ${contentType || 'not specified'}\n` +
    `Expiry: ${expiresIn}s\n` +
    `This is a migration scaffold - install AWS SDK when ready to implement presigned uploads.`
  );
}

/**
 * Helper: Build R2 object key for an artifact
 * 
 * Consistent naming convention for artifact storage:
 * - items/{itemId}/{artifactType}.{ext}
 * - Example: items/abc123xyz/video.mp4
 * 
 * @param itemId - Content item ID
 * @param artifactType - Type of artifact (video, transcript, analysis, cover, archive)
 * @param extension - File extension (mp4, txt, json, jpg, etc.)
 */
export function buildArtifactKey(
  itemId: string,
  artifactType: 'video' | 'transcript' | 'analysis' | 'cover' | 'archive',
  extension: string
): string {
  return `items/${itemId}/${artifactType}.${extension}`;
}

/**
 * Helper: Parse artifact key to extract item ID and artifact type
 * 
 * @param artifactKey - R2 object key (e.g., "items/abc123/video.mp4")
 * @returns Parsed components or null if key doesn't match expected format
 */
export function parseArtifactKey(artifactKey: string): {
  itemId: string;
  artifactType: string;
  extension: string;
} | null {
  const match = artifactKey.match(/^items\/([^/]+)\/([^.]+)\.(.+)$/);
  if (!match) {
    return null;
  }
  
  const [, itemId, artifactType, extension] = match;
  return { itemId, artifactType, extension };
}
