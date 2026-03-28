/**
 * Tests for intake API route
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../app/api/intake/route';
import * as workspaceStore from '../../lib/services/workspace-store';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mock data directory for tests
let testDataDir: string;

// Override paths module to use test directory
beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'intake-test-'));
  process.env.DATA_ROOT = testDataDir;
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
});

describe('POST /api/intake', () => {
  describe('creator-profile links', () => {
    it('creates a session and returns creator classification with session ID', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.douyin.com/user/MS4wLjABAAAAtest' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        sessionId: expect.any(String),
        inputType: 'creator-profile',
        nextRoute: expect.stringContaining('/sessions/'),
      });

      // Verify session was created
      const session = await workspaceStore.loadSession(data.sessionId);
      expect(session).toBeTruthy();
      expect(session?.inputType).toBe('creator-profile');
      expect(session?.inputLink).toBe('https://www.douyin.com/user/MS4wLjABAAAAtest');
    });

    it('routes to candidate review page', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://v.douyin.com/user/ABC123/' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(data.nextRoute).toMatch(/^\/sessions\/[^/]+$/);
    });
  });

  describe('single-video links', () => {
    it('creates a session and returns single-video classification', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.douyin.com/video/1234567890123456789' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        sessionId: expect.any(String),
        inputType: 'single-video',
        nextRoute: expect.stringContaining('/sessions/'),
      });

      // Verify session was created
      const session = await workspaceStore.loadSession(data.sessionId);
      expect(session).toBeTruthy();
      expect(session?.inputType).toBe('single-video');
    });

    it('routes to preparation page', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://v.douyin.com/ieFvABC/' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();
      
      // Single-video should still route to session page (which will show prep status)
      expect(data.nextRoute).toMatch(/^\/sessions\/[^/]+$/);
    });
  });

  describe('unsupported inputs', () => {
    it('returns 400 for non-Douyin URLs', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.youtube.com/watch?v=abc' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.stringContaining('supported'),
        inputType: 'unsupported',
      });
    });

    it('returns 400 for malformed URLs', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'not-a-url' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.inputType).toBe('unsupported');
    });

    it('returns 400 for empty input', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('returns 400 for out-of-scope Douyin paths', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.douyin.com/search/test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.inputType).toBe('unsupported');
    });
  });

  describe('request validation', () => {
    it('returns 400 for missing link field', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid JSON', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
