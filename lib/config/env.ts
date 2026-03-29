/**
 * Environment Configuration Contracts
 * 
 * This module defines explicit contracts for hosted platform environment variables
 * and provides safe access patterns that enforce browser/server separation.
 * 
 * CRITICAL RULES:
 * - Browser-safe variables: prefixed with NEXT_PUBLIC_
 * - Server-only variables: NO NEXT_PUBLIC_ prefix, never exposed to browser
 * - All access must go through these typed getters
 * - Missing required variables throw clear errors at startup
 */

// ============================================================================
// Browser-Safe Environment Variables
// ============================================================================

/**
 * Supabase URL - safe for browser exposure
 * Required for Supabase client initialization
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required but not set. ' +
      'Add it to .env.local for local development.'
    );
  }
  return url;
}

/**
 * Supabase publishable (anonymous) key - safe for browser exposure
 * Required for browser-side Supabase auth and queries
 */
export function getSupabasePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required but not set. ' +
      'Add it to .env.local for local development.'
    );
  }
  return key;
}

// ============================================================================
// Server-Only Environment Variables
// ============================================================================

/**
 * Supabase service role key - SERVER ONLY, NEVER expose to browser
 * Required for server-side admin operations and RLS bypass
 */
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access SUPABASE_SERVICE_ROLE_KEY from browser context. ' +
      'This secret must NEVER be exposed to the client.'
    );
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return key;
}

/**
 * Cloudflare R2 Account ID - SERVER ONLY
 */
export function getR2AccountId(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access R2_ACCOUNT_ID from browser context. ' +
      'This configuration must remain server-only.'
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error(
      'R2_ACCOUNT_ID is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return accountId;
}

/**
 * Cloudflare R2 Bucket Name - SERVER ONLY
 */
export function getR2BucketName(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access R2_BUCKET_NAME from browser context. ' +
      'This configuration must remain server-only.'
    );
  }

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error(
      'R2_BUCKET_NAME is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return bucket;
}

/**
 * Cloudflare R2 credential ID - SERVER ONLY
 */
export function getR2CredentialId(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access R2_KEY_ID from browser context. ' +
      'Storage credentials must NEVER be exposed to the client.'
    );
  }

  const credId = process.env.R2_KEY_ID;
  if (!credId) {
    throw new Error(
      'R2_KEY_ID is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return credId;
}

/**
 * Cloudflare R2 credential secret - SERVER ONLY
 */
export function getR2CredentialSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access R2_KEY_SECRET from browser context. ' +
      'Storage secrets must NEVER be exposed to the client.'
    );
  }

  const credSecret = process.env.R2_KEY_SECRET;
  if (!credSecret) {
    throw new Error(
      'R2_KEY_SECRET is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return credSecret;
}

/**
 * Worker Shared Secret - SERVER ONLY
 * Used for authenticating web->worker requests
 */
export function getWorkerSharedSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access WORKER_SHARED_SECRET from browser context. ' +
      'Shared secrets must NEVER be exposed to the client.'
    );
  }

  const secret = process.env.WORKER_SHARED_SECRET;
  if (!secret) {
    throw new Error(
      'WORKER_SHARED_SECRET is required but not set. ' +
      'Add it to .env.local for local development (server-only variable).'
    );
  }
  return secret;
}

// ============================================================================
// Optional Configuration
// ============================================================================

/**
 * Worker base URL - SERVER ONLY (optional during early migration)
 * URL of the Railway-hosted worker service
 */
export function getWorkerBaseUrl(): string | undefined {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to access WORKER_BASE_URL from browser context. ' +
      'Worker configuration must remain server-only.'
    );
  }

  return process.env.WORKER_BASE_URL;
}

// ============================================================================
// Migration Flags
// ============================================================================

/**
 * Feature flag: Use hosted persistence instead of local filesystem
 * When true, application uses Supabase for sessions/items/drafts
 * When false, application uses legacy data/workspaces/ filesystem persistence
 */
export function useHostedPersistence(): boolean {
  const flag = process.env.USE_HOSTED_PERSISTENCE;
  return flag === 'true' || flag === '1';
}

/**
 * Feature flag: Use R2 for artifact storage instead of local filesystem
 * When true, prepared artifacts are stored in Cloudflare R2
 * When false, artifacts reference local filesystem paths
 */
export function useHostedStorage(): boolean {
  const flag = process.env.USE_HOSTED_STORAGE;
  return flag === 'true' || flag === '1';
}

/**
 * Feature flag: Use Railway worker for preparation instead of in-process
 * When true, preparation jobs are enqueued for Railway worker
 * When false, preparation runs in the Next.js request context (V1 mode)
 */
export function useHostedWorker(): boolean {
  const flag = process.env.USE_HOSTED_WORKER;
  return flag === 'true' || flag === '1';
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if all required browser-safe environment variables are present
 * Call this at application startup for browser contexts
 */
export function validateBrowserEnv(): void {
  try {
    getSupabaseUrl();
    getSupabasePublishableKey();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Browser environment validation failed:', error.message);
    }
    throw error;
  }
}

/**
 * Check if all required server-only environment variables are present
 * Call this at application startup for server contexts
 * 
 * @param requireWorker - Whether to require worker configuration (default: false for migration safety)
 */
export function validateServerEnv(requireWorker = false): void {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv must only be called from server context');
  }

  try {
    // Validate Supabase credentials
    getSupabaseServiceRoleKey();

    // Validate R2 credentials
    getR2AccountId();
    getR2BucketName();
    getR2CredentialId();
    getR2CredentialSecret();

    // Validate worker credentials if required
    if (requireWorker) {
      getWorkerSharedSecret();
      const workerUrl = getWorkerBaseUrl();
      if (!workerUrl) {
        throw new Error(
          'WORKER_BASE_URL is required when requireWorker=true but not set. ' +
          'Add it to .env.local for local development (server-only variable).'
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Server environment validation failed:', error.message);
    }
    throw error;
  }
}
