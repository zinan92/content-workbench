/**
 * Hosted Platform Clients
 * 
 * Centralized exports for all hosted platform client factories.
 * 
 * USAGE:
 * ```typescript
 * // Browser-safe imports
 * import { createBrowserSupabaseClient } from '@/lib/clients'
 * 
 * // Server-only imports
 * import {
 *   createServerSupabaseClient,
 *   createAdminSupabaseClient,
 *   createR2Client,
 * } from '@/lib/clients'
 * ```
 */

// Supabase clients
export {
  createBrowserSupabaseClient,
  createServerSupabaseClient,
  createAdminSupabaseClient,
  type SupabaseClient,
  type DatabaseSchema,
} from './supabase';

// R2 storage clients (server-only)
export {
  createR2Client,
  generatePresignedDownloadUrl,
  generatePresignedUploadUrl,
  buildArtifactKey,
  parseArtifactKey,
  type R2Client,
} from './r2';
