/**
 * Server-side auth utilities
 * 
 * Provides functions for getting the current user, checking auth status,
 * and handling server-side auth requirements.
 */

import { createServerSupabaseClient } from '@/lib/clients/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Get the current authenticated user from server context
 * 
 * Returns null if no user is authenticated.
 * Use this in Server Components, Server Actions, and API routes.
 * 
 * @example
 * ```tsx
 * import { getCurrentUser } from '@/lib/auth/server'
 * 
 * export default async function DashboardPage() {
 *   const user = await getCurrentUser()
 *   if (!user) {
 *     redirect('/auth/sign-in')
 *   }
 *   // ...
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  return user;
}

/**
 * Get the current user's ID
 * 
 * Returns null if no user is authenticated.
 * Convenience wrapper around getCurrentUser().
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Require an authenticated user in server context
 * 
 * Throws an error with a 401 status if no user is authenticated.
 * Use this in API routes where you want to enforce authentication.
 * 
 * @example
 * ```tsx
 * import { requireUser } from '@/lib/auth/server'
 * 
 * export async function GET() {
 *   const user = await requireUser()
 *   // user is guaranteed to be non-null here
 * }
 * ```
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  
  return user;
}

/**
 * Require an authenticated user and return their ID
 * 
 * Throws an error with a 401 status if no user is authenticated.
 * Convenience wrapper around requireUser().
 */
export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

/**
 * Check if a user is authenticated
 * 
 * Returns true if a user is authenticated, false otherwise.
 * Useful for conditional rendering or logic based on auth state.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
