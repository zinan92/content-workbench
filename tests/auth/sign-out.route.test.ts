/**
 * Tests for sign-out API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/auth/sign-out', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns success when sign-out succeeds', async () => {
    // Mock Supabase client
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        signOut: mockSignOut,
      },
    };

    vi.doMock('@/lib/clients/supabase', () => ({
      createServerSupabaseClient: () => mockSupabase,
    }));

    const { POST } = await import('@/app/api/auth/sign-out/route');
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('returns error when sign-out fails', async () => {
    // Mock Supabase client with error
    const mockSignOut = vi.fn().mockResolvedValue({
      error: { message: 'Sign-out failed' },
    });
    const mockSupabase = {
      auth: {
        signOut: mockSignOut,
      },
    };

    vi.doMock('@/lib/clients/supabase', () => ({
      createServerSupabaseClient: () => mockSupabase,
    }));

    const { POST } = await import('@/app/api/auth/sign-out/route');
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Sign-out failed');
  });
});
