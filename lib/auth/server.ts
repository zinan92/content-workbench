/**
 * Server-side auth utilities
 *
 * V1 LOCAL MODE: Local-first remains the default. Unless hosted persistence
 * is explicitly enabled, auth functions return a fixed local operator identity.
 *
 * V2 HOSTED MODE: When hosted persistence is explicitly enabled, auth functions
 * delegate to Supabase for real user authentication.
 */

const LOCAL_OPERATOR_ID = 'local-operator';

/**
 * Check if we're running in local-first mode.
 */
function isLocalMode(): boolean {
  const hostedFlag = process.env.USE_HOSTED_PERSISTENCE;
  return hostedFlag !== 'true' && hostedFlag !== '1';
}

/**
 * Minimal user shape for local mode (no Supabase dependency)
 */
interface LocalUser {
  id: string;
  email?: string;
}

/**
 * Get the current authenticated user from server context
 *
 * In local mode: returns a fixed local operator identity.
 * In hosted mode: delegates to Supabase auth.
 */
export async function getCurrentUser(): Promise<LocalUser | null> {
  if (isLocalMode()) {
    return { id: LOCAL_OPERATOR_ID, email: 'operator@local' };
  }

  const { createServerSupabaseClient } = await import('@/lib/clients/supabase');
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's ID
 *
 * In local mode: returns 'local-operator'.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Require an authenticated user in server context
 *
 * In local mode: always succeeds with local operator.
 * In hosted mode: throws 401 if not authenticated.
 */
export async function requireUser(): Promise<LocalUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  return user;
}

/**
 * Require an authenticated user and return their ID
 */
export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

/**
 * Check if a user is authenticated
 *
 * In local mode: always returns true.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
