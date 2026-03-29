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

/**
 * Supabase client interface
 * 
 * This is a placeholder for the actual @supabase/supabase-js client type.
 * When @supabase/supabase-js is installed, replace this with:
 *   import type { SupabaseClient } from '@supabase/supabase-js'
 * 
 * For now, we define a minimal interface that documents the contract.
 */
export interface SupabaseClient<Database = unknown> {
  // Auth
  auth: {
    signIn: (credentials: unknown) => Promise<unknown>;
    signOut: () => Promise<unknown>;
    getSession: () => Promise<unknown>;
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => unknown;
  };
  
  // Database queries
  from: <T extends keyof Database>(table: T) => unknown;
  
  // Storage
  storage: {
    from: (bucket: string) => unknown;
  };
  
  // RPC
  rpc: (fn: string, params?: unknown) => Promise<unknown>;
}

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
  const _supabaseKey = getSupabasePublishableKey();
  
  // TODO: Replace with actual Supabase client creation when @supabase/supabase-js is installed:
  // import { createClient } from '@supabase/supabase-js'
  // return createClient<Database>(supabaseUrl, _supabaseKey, {
  //   auth: {
  //     persistSession: true,
  //     autoRefreshToken: true,
  //   },
  // })
  
  // Placeholder: throw clear error for now
  throw new Error(
    `Browser Supabase client factory called but @supabase/supabase-js not yet installed.\n` +
    `URL: ${supabaseUrl}\n` +
    `This is a migration scaffold - install Supabase SDK when ready to implement auth.`
  );
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
  const _supabaseKey = getSupabasePublishableKey();
  
  // TODO: Replace with actual server-side Supabase client when @supabase/ssr is installed:
  // import { createServerClient } from '@supabase/ssr'
  // import { cookies } from 'next/headers'
  // 
  // return createServerClient<Database>(supabaseUrl, _supabaseKey, {
  //   cookies: {
  //     get(name: string) {
  //       return cookies().get(name)?.value
  //     },
  //     set(name: string, value: string, options: CookieOptions) {
  //       cookies().set({ name, value, ...options })
  //     },
  //     remove(name: string, options: CookieOptions) {
  //       cookies().set({ name, value: '', ...options })
  //     },
  //   },
  // })
  
  // Placeholder: throw clear error for now
  throw new Error(
    `Server Supabase client factory called but @supabase/ssr not yet installed.\n` +
    `URL: ${supabaseUrl}\n` +
    `This is a migration scaffold - install Supabase SSR package when ready to implement server auth.`
  );
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
  
  // TODO: Replace with actual admin client creation when @supabase/supabase-js is installed:
  // import { createClient } from '@supabase/supabase-js'
  // return createClient<Database>(supabaseUrl, serviceRoleKey, {
  //   auth: {
  //     persistSession: false,
  //     autoRefreshToken: false,
  //   },
  // })
  
  // Placeholder: throw clear error for now
  throw new Error(
    `Admin Supabase client factory called but @supabase/supabase-js not yet installed.\n` +
    `URL: ${supabaseUrl}\n` +
    `Service role key: ${serviceRoleKey.substring(0, 10)}...\n` +
    `This is a migration scaffold - install Supabase SDK when ready to implement admin operations.`
  );
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
