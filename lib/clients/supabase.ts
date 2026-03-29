/**
 * Supabase Client Factory
 * 
 * Provides centralized client creation for Supabase interactions with explicit
 * browser-safe vs server-only separation.
 * 
 * USAGE RULES:
 * - Browser components/hooks: use createBrowserSupabaseClient()
 * - Server components/actions: use createServerSupabaseClient()
 * - Admin operations (RLS bypass): use createAdminSupabaseClient() - SERVER ONLY
 * - Never expose admin/service-role client to browser context
 * 
 * TYPE SAFETY:
 * When Supabase schema types are generated, import them and pass to these factories:
 *   import type { Database } from '@/types/supabase'
 *   const client = createBrowserSupabaseClient<Database>()
 */

import {
  getSupabaseUrl,
  getSupabasePublishableKey,
  getSupabaseServiceRoleKey,
} from '../config/env';

import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Re-export the official Supabase client type
 */
export type SupabaseClient<Database = unknown> = SupabaseClientType<Database>;

/**
 * Create a browser-safe Supabase client
 * 
 * This client uses the publishable (anonymous) key and respects RLS policies.
 * Safe for use in browser components, client-side hooks, and client-side utilities.
 * 
 * WHEN TO USE:
 * - React components that run in the browser
 * - Client-side data fetching
 * - User authentication flows
 * - RLS-protected queries from the browser
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * import { createBrowserSupabaseClient } from '@/lib/clients/supabase'
 * 
 * export function MyComponent() {
 *   const supabase = createBrowserSupabaseClient()
 *   // Use for auth, queries, etc.
 * }
 * ```
 */
export function createBrowserSupabaseClient<Database = unknown>(): SupabaseClient<Database> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Create a server-side Supabase client
 * 
 * This client uses the publishable key but runs server-side with request-scoped
 * auth context. Respects RLS policies based on the current authenticated user.
 * 
 * WHEN TO USE:
 * - Next.js Server Components
 * - Next.js Server Actions
 * - API Route Handlers (when you want RLS enforcement)
 * - Server-side data fetching for the current authenticated user
 * 
 * NOTE: For RLS bypass or admin operations, use createAdminSupabaseClient instead.
 * 
 * @example
 * ```tsx
 * // app/dashboard/page.tsx (Server Component)
 * import { createServerSupabaseClient } from '@/lib/clients/supabase'
 * 
 * export default async function DashboardPage() {
 *   const supabase = createServerSupabaseClient()
 *   // Fetch user's own data with RLS enforcement
 * }
 * ```
 */
export function createServerSupabaseClient<Database = unknown>(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL: createServerSupabaseClient called from browser context. ' +
      'Use createBrowserSupabaseClient for browser-side code.'
    );
  }
  
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();
  
  // Dynamic imports for server-only modules
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createServerClient } = require('@supabase/ssr') as typeof import('@supabase/ssr');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require('next/headers') as typeof import('next/headers');
  
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            } else {
              cookieStore.set(name, value);
            }
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Create an admin Supabase client with RLS bypass
 * 
 * This client uses the service role key and bypasses all RLS policies.
 * **CRITICAL: SERVER ONLY - NEVER expose to browser**
 * 
 * WHEN TO USE:
 * - Admin operations that need to bypass RLS
 * - Background jobs that run without user context
 * - System-level data migrations
 * - Operations that aggregate across all users
 * 
 * WHEN NOT TO USE:
 * - Regular user-scoped queries (use createServerSupabaseClient)
 * - Browser-side operations (use createBrowserSupabaseClient)
 * - Any code that could execute in browser context
 * 
 * @example
 * ```tsx
 * // app/api/admin/cleanup/route.ts (API Route - server only)
 * import { createAdminSupabaseClient } from '@/lib/clients/supabase'
 * 
 * export async function POST() {
 *   const supabase = createAdminSupabaseClient()
 *   // Perform admin operation with RLS bypass
 * }
 * ```
 */
export function createAdminSupabaseClient<Database = unknown>(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Attempted to create admin Supabase client from browser context. ' +
      'Admin clients with service role key must NEVER be used in browser code. ' +
      'Use createBrowserSupabaseClient for browser-side code.'
    );
  }
  
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Type helper for database schema
 * 
 * When you generate Supabase types, create a types/supabase.ts file with:
 * 
 * ```typescript
 * export type Database = {
 *   public: {
 *     Tables: {
 *       sessions: { Row: ..., Insert: ..., Update: ... },
 *       items: { Row: ..., Insert: ..., Update: ... },
 *       // etc.
 *     }
 *   }
 * }
 * ```
 * 
 * Then use it with the client factories for full type safety.
 */
export type DatabaseSchema = unknown;
