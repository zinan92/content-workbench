/**
 * Tests for server-side auth utilities
 *
 * V1 local mode: When Supabase env vars are not set, auth functions
 * return a fixed local-operator identity without any Supabase calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Server auth utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Ensure local mode (no Supabase env) is the default test state
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('local mode (no Supabase configured)', () => {
    it('getCurrentUser returns local operator', async () => {
      const { getCurrentUser } = await import('@/lib/auth/server');
      const user = await getCurrentUser();

      expect(user).toEqual({ id: 'local-operator', email: 'operator@local' });
    });

    it('getCurrentUserId returns local-operator', async () => {
      const { getCurrentUserId } = await import('@/lib/auth/server');
      const userId = await getCurrentUserId();

      expect(userId).toBe('local-operator');
    });

    it('requireUser returns local operator without throwing', async () => {
      const { requireUser } = await import('@/lib/auth/server');
      const user = await requireUser();

      expect(user.id).toBe('local-operator');
    });

    it('requireUserId returns local-operator without throwing', async () => {
      const { requireUserId } = await import('@/lib/auth/server');
      const userId = await requireUserId();

      expect(userId).toBe('local-operator');
    });

    it('isAuthenticated returns true', async () => {
      const { isAuthenticated } = await import('@/lib/auth/server');
      const authed = await isAuthenticated();

      expect(authed).toBe(true);
    });

    it('stays in local mode when Supabase env vars exist but hosted persistence is disabled', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      process.env.USE_HOSTED_PERSISTENCE = 'false';

      const { getCurrentUser } = await import('@/lib/auth/server');
      const user = await getCurrentUser();

      expect(user).toEqual({ id: 'local-operator', email: 'operator@local' });
    });
  });

  describe('hosted mode (Supabase configured)', () => {
    it('getCurrentUser delegates to Supabase when env vars are set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      process.env.USE_HOSTED_PERSISTENCE = 'true';

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };

      vi.doMock('@/lib/clients/supabase', () => ({
        createServerSupabaseClient: () => mockSupabase,
      }));

      const { getCurrentUser } = await import('@/lib/auth/server');
      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('requireUser throws when Supabase returns no user', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      process.env.USE_HOSTED_PERSISTENCE = 'true';

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };

      vi.doMock('@/lib/clients/supabase', () => ({
        createServerSupabaseClient: () => mockSupabase,
      }));

      const { requireUser } = await import('@/lib/auth/server');

      await expect(requireUser()).rejects.toThrow('Unauthorized: Authentication required');
    });

    it('isAuthenticated returns false when Supabase returns no user', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      process.env.USE_HOSTED_PERSISTENCE = 'true';

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };

      vi.doMock('@/lib/clients/supabase', () => ({
        createServerSupabaseClient: () => mockSupabase,
      }));

      const { isAuthenticated } = await import('@/lib/auth/server');
      const authed = await isAuthenticated();

      expect(authed).toBe(false);
    });
  });
});
