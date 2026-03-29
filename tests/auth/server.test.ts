/**
 * Tests for server-side auth utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Server auth utilities', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
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

    it('returns null when not authenticated', async () => {
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

      const { getCurrentUser } = await import('@/lib/auth/server');
      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getCurrentUserId', () => {
    it('returns user ID when authenticated', async () => {
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

      const { getCurrentUserId } = await import('@/lib/auth/server');
      const userId = await getCurrentUserId();

      expect(userId).toBe('user-123');
    });

    it('returns null when not authenticated', async () => {
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

      const { getCurrentUserId } = await import('@/lib/auth/server');
      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });
  });

  describe('requireUser', () => {
    it('returns user when authenticated', async () => {
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

      const { requireUser } = await import('@/lib/auth/server');
      const user = await requireUser();

      expect(user).toEqual(mockUser);
    });

    it('throws error when not authenticated', async () => {
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
  });

  describe('requireUserId', () => {
    it('returns user ID when authenticated', async () => {
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

      const { requireUserId } = await import('@/lib/auth/server');
      const userId = await requireUserId();

      expect(userId).toBe('user-123');
    });

    it('throws error when not authenticated', async () => {
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

      const { requireUserId } = await import('@/lib/auth/server');

      await expect(requireUserId()).rejects.toThrow('Unauthorized: Authentication required');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when authenticated', async () => {
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

      const { isAuthenticated } = await import('@/lib/auth/server');
      const authed = await isAuthenticated();

      expect(authed).toBe(true);
    });

    it('returns false when not authenticated', async () => {
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
