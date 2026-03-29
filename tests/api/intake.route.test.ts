/**
 * Tests for intake API route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../../app/api/intake/route';
import * as workspaceStore from '../../lib/services/workspace-store';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setupAuthMock } from '../utils/auth-mock';

// Mock feature flag to use filesystem persistence for tests
vi.mock('@/lib/config/env', async () => {
  const actual = await vi.importActual('@/lib/config/env');
  return {
    ...actual,
    useHostedPersistence: vi.fn(() => false),
    useHostedStorage: vi.fn(() => false),
    useHostedWorker: vi.fn(() => false),
  };
});

// Mock data directory for tests
let testDataDir: string;
let authCleanup: () => void;

// Override paths module to use test directory
beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'intake-test-'));
  process.env.DATA_ROOT = testDataDir;
  authCleanup = setupAuthMock();
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
  authCleanup();
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

    // VAL-INTAKE-007: Nested Douyin user-search pages stay unsupported at intake
    it('returns 400 for nested user-search URLs with preserved input', async () => {
      const nestedUrl = 'https://www.douyin.com/user/self/search/%E6%85%A2%E5%AD%A6ai?aid=8361ee96-5a5c-46a8-a327-6261655fc3f2&modal_id=7621978881326583092&type=general';
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: nestedUrl }),
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

    it('returns 400 for other nested user paths like /user/self/following', async () => {
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.douyin.com/user/self/following' }),
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

  describe('recoverable discovery failures (VAL-INTAKE-006)', () => {
    it('returns 422 with preserved link when supported Douyin creator link fails resolution', async () => {
      // Trigger discovery failure mode
      process.env.CONTENT_WORKBENCH_DISCOVERY_MODE = 'fail-on-resolution';

      const link = 'https://www.douyin.com/user/MS4wLjABAAAAfail';
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.stringContaining('resolve'),
        errorType: 'resolution-failure',
        inputType: 'creator-profile',
        preservedLink: link,
      });

      // Clean up
      delete process.env.CONTENT_WORKBENCH_DISCOVERY_MODE;
    });

    it('returns 422 with preserved link when supported Douyin video link fails resolution', async () => {
      // Trigger discovery failure mode
      process.env.CONTENT_WORKBENCH_DISCOVERY_MODE = 'fail-on-resolution';

      const link = 'https://www.douyin.com/video/7234567890123456789';
      const request = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.stringContaining('resolve'),
        errorType: 'resolution-failure',
        inputType: 'single-video',
        preservedLink: link,
      });

      // Clean up
      delete process.env.CONTENT_WORKBENCH_DISCOVERY_MODE;
    });

    it('distinguishes resolution failures from unsupported-scope validation errors', async () => {
      // Unsupported scope error
      const unsupportedRequest = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.youtube.com/watch?v=test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const unsupportedResponse = await POST(unsupportedRequest);
      expect(unsupportedResponse.status).toBe(400);
      const unsupportedData = await unsupportedResponse.json();
      expect(unsupportedData.inputType).toBe('unsupported');
      expect(unsupportedData).not.toHaveProperty('errorType');

      // Resolution failure
      process.env.CONTENT_WORKBENCH_DISCOVERY_MODE = 'fail-on-resolution';
      const resolutionRequest = new Request('http://localhost:3100/api/intake', {
        method: 'POST',
        body: JSON.stringify({ link: 'https://www.douyin.com/user/MS4wLjABAAAAfail' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const resolutionResponse = await POST(resolutionRequest);
      expect(resolutionResponse.status).toBe(422);
      const resolutionData = await resolutionResponse.json();
      expect(resolutionData.errorType).toBe('resolution-failure');
      expect(resolutionData.inputType).toBe('creator-profile');

      delete process.env.CONTENT_WORKBENCH_DISCOVERY_MODE;
    });
  });
});
