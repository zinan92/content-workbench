/**
 * Tests for session API route with discovery integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/sessions/[sessionId]/route';
import { POST as intakePost } from '@/app/api/intake/route';
import type { Session, ContentItem } from '@/lib/domain/types';
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

describe('GET /api/sessions/[sessionId]', () => {
  const cleanup = setupAuthMock();
  
  afterEach(() => {
    cleanup();
  });

  describe('creator-profile sessions', () => {
    it('triggers discovery on first load and returns candidates', async () => {
      // Create a creator-profile session via intake
      const intakeRequest = new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: 'https://www.douyin.com/user/MS4wLjABAAAAtest',
        }),
      });

      const intakeResponse = await intakePost(intakeRequest);
      expect(intakeResponse.status).toBe(200);

      const intakeData = await intakeResponse.json();
      expect(intakeData.success).toBe(true);
      const sessionId = intakeData.sessionId;

      // Load the session (should trigger discovery)
      const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const paramsPromise = Promise.resolve({ sessionId });

      const sessionResponse = await GET(sessionRequest, { params: paramsPromise });
      expect(sessionResponse.status).toBe(200);

      const sessionData = await sessionResponse.json();

      // Verify session data structure
      expect(sessionData).toHaveProperty('session');
      expect(sessionData).toHaveProperty('candidates');
      expect(sessionData).toHaveProperty('isPartial');

      const session = sessionData.session as Session;
      const candidates = sessionData.candidates as ContentItem[];

      // Verify session properties
      expect(session.inputType).toBe('creator-profile');
      expect(session.candidateIds.length).toBeGreaterThan(0);

      // Verify candidates were discovered
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.length).toBe(session.candidateIds.length);

      // Verify each candidate has required fields
      for (const candidate of candidates) {
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('source');
        expect(candidate).toHaveProperty('simpleScore');
        expect(candidate).toHaveProperty('recommended');
        expect(candidate).toHaveProperty('prepStatus');
        expect(candidate.prepStatus).toBe('pending');

        // Verify source metadata
        expect(candidate.source).toHaveProperty('title');
        expect(candidate.source).toHaveProperty('sourceUrl');
        expect(typeof candidate.source.title).toBe('string');
        expect(typeof candidate.source.sourceUrl).toBe('string');

        // Verify score and recommendation
        expect(typeof candidate.simpleScore).toBe('number');
        expect(candidate.simpleScore).toBeGreaterThanOrEqual(0);
        expect(candidate.simpleScore).toBeLessThanOrEqual(100);
        expect(typeof candidate.recommended).toBe('boolean');
      }
    });

    it('returns existing candidates on subsequent loads without re-discovery', async () => {
      // Create and discover once
      const intakeRequest = new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: 'https://www.douyin.com/user/MS4wLjABAAAAtest2',
        }),
      });

      const intakeResponse = await intakePost(intakeRequest);
      const intakeData = await intakeResponse.json();
      const sessionId = intakeData.sessionId;

      // First load (triggers discovery)
      const firstRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const firstParams = Promise.resolve({ sessionId });
      const firstResponse = await GET(firstRequest, { params: firstParams });
      const firstData = await firstResponse.json();
      const firstCandidates = firstData.candidates as ContentItem[];
      const firstCandidateIds = firstCandidates.map(c => c.id).sort();

      // Second load (should return existing)
      const secondRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const secondParams = Promise.resolve({ sessionId });
      const secondResponse = await GET(secondRequest, { params: secondParams });
      const secondData = await secondResponse.json();
      const secondCandidates = secondData.candidates as ContentItem[];
      const secondCandidateIds = secondCandidates.map(c => c.id).sort();

      // Should have same candidates by ID
      expect(secondCandidates.length).toBe(firstCandidates.length);
      expect(secondCandidateIds).toEqual(firstCandidateIds);
    });
  });

  describe('single-video sessions', () => {
    it('returns session without candidates array', async () => {
      // Create a single-video session
      const intakeRequest = new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: 'https://www.douyin.com/video/1234567890123456789',
        }),
      });

      const intakeResponse = await intakePost(intakeRequest);
      const intakeData = await intakeResponse.json();
      const sessionId = intakeData.sessionId;

      // Load the session
      const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const paramsPromise = Promise.resolve({ sessionId });

      const sessionResponse = await GET(sessionRequest, { params: paramsPromise });
      expect(sessionResponse.status).toBe(200);

      const sessionData = await sessionResponse.json();

      // Should only have session, no candidates
      expect(sessionData).toHaveProperty('session');
      expect(sessionData).not.toHaveProperty('candidates');
      expect(sessionData.session.inputType).toBe('single-video');
    });
  });

  describe('partial discovery results (VAL-CANDIDATES-009)', () => {
    it('returns partial flag and shows usable candidate table when discovery is incomplete', async () => {
      // Create a creator-profile session via intake
      const intakeRequest = new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: 'https://www.douyin.com/user/MS4wLjABAAAApartial',
        }),
      });

      // Use partial discovery mode
      process.env.CONTENT_WORKBENCH_DISCOVERY_MODE = 'partial';

      const intakeResponse = await intakePost(intakeRequest);
      expect(intakeResponse.status).toBe(200);

      const intakeData = await intakeResponse.json();
      const sessionId = intakeData.sessionId;

      // Load the session (should trigger partial discovery)
      const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const paramsPromise = Promise.resolve({ sessionId });

      const sessionResponse = await GET(sessionRequest, { params: paramsPromise });
      expect(sessionResponse.status).toBe(200);

      const sessionData = await sessionResponse.json();

      // Verify partial flag is set
      expect(sessionData.isPartial).toBe(true);

      // Verify candidates are still returned despite being partial
      const candidates = sessionData.candidates as ContentItem[];
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.length).toBeLessThan(8); // Should be fewer than normal fixture count

      // Verify each candidate is properly structured
      for (const candidate of candidates) {
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('source');
        expect(candidate).toHaveProperty('simpleScore');
        expect(candidate).toHaveProperty('recommended');
        expect(typeof candidate.simpleScore).toBe('number');
      }

      // Clean up
      delete process.env.CONTENT_WORKBENCH_DISCOVERY_MODE;
    });

    it('returns isPartial false for complete discovery', async () => {
      // Create a creator-profile session with normal discovery
      const intakeRequest = new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: 'https://www.douyin.com/user/MS4wLjABAAAAcomplete',
        }),
      });

      const intakeResponse = await intakePost(intakeRequest);
      const intakeData = await intakeResponse.json();
      const sessionId = intakeData.sessionId;

      // Load the session
      const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
      const paramsPromise = Promise.resolve({ sessionId });

      const sessionResponse = await GET(sessionRequest, { params: paramsPromise });
      const sessionData = await sessionResponse.json();

      // Verify isPartial is false for complete discovery
      expect(sessionData.isPartial).toBe(false);
      expect(sessionData.candidates.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('returns 404 for non-existent session', async () => {
      const request = new Request('http://localhost/api/sessions/nonexistent');
      const paramsPromise = Promise.resolve({ sessionId: 'nonexistent' });

      const response = await GET(request, { params: paramsPromise });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
