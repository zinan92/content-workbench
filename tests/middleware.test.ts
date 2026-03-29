import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('middleware local-first auth gating', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not redirect to sign-in when Supabase env vars exist but hosted persistence is disabled', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
    process.env.USE_HOSTED_PERSISTENCE = 'false';

    const { middleware } = await import('../middleware');
    const request = new NextRequest('http://localhost:3000/');

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
