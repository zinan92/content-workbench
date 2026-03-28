/**
 * Tests for single-video intake and item hydration
 * 
 * Coverage:
 * - VAL-INTAKE-002: Single-video intake routes to preparation
 * - VAL-PREP-002: Single-video preparation starts with exactly one item
 * - VAL-CROSS-004: Single-video flow skips candidate review
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST as intakePost } from '@/app/api/intake/route';
import { GET as sessionGet } from '@/app/api/sessions/[sessionId]/route';
import { loadItem } from '@/lib/services/workspace-store';
import type { Session, ContentItem } from '@/lib/domain/types';

let testDataDir: string;

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'single-video-test-'));
  process.env.DATA_ROOT = testDataDir;
});

afterEach(async () => {
  if (testDataDir) {
    // Wait for background preparation to complete before cleanup
    await new Promise(resolve => setTimeout(resolve, 400));
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
});

describe('Single-video intake and preparation flow', () => {
  it('creates exactly one preparation item for single-video intake', async () => {
    // Submit single-video link
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/video/1234567890123456789',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    expect(intakeResponse.status).toBe(200);

    const intakeData = await intakeResponse.json();
    expect(intakeData.success).toBe(true);
    expect(intakeData.inputType).toBe('single-video');
    
    const sessionId = intakeData.sessionId;

    // Load the session - should have exactly one item
    const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId }),
    });
    
    expect(sessionResponse.status).toBe(200);
    
    const sessionData = await sessionResponse.json();
    
    // Verify session properties
    expect(sessionData).toHaveProperty('session');
    expect(sessionData).toHaveProperty('items');
    expect(sessionData).not.toHaveProperty('candidates');
    
    const session = sessionData.session as Session;
    const items = sessionData.items as ContentItem[];
    
    // VAL-PREP-002: Exactly one item
    expect(items.length).toBe(1);
    expect(session.candidateIds.length).toBe(1);
    expect(session.selectedIds.length).toBe(1);
    
    // Verify the item is properly structured
    const item = items[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('source');
    expect(item).toHaveProperty('prepStatus');
    expect(item.prepStatus).toBe('pending');
    expect(item.sessionId).toBe(sessionId);
    
    // Verify source metadata
    expect(item.source.sourceUrl).toBe('https://www.douyin.com/video/1234567890123456789');
    expect(typeof item.source.title).toBe('string');
    expect(item.source.title.length).toBeGreaterThan(0);
  });

  it('sets workflow phase to preparation for single-video sessions', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://v.douyin.com/ieFvABC/',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    const intakeData = await intakeResponse.json();
    const sessionId = intakeData.sessionId;

    const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId }),
    });
    
    const sessionData = await sessionResponse.json();
    const session = sessionData.session as Session;
    
    expect(session.workflowPhase).toBe('preparation');
  });

  it('marks the single-video item as selected by default', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/video/9876543210987654321',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    const intakeData = await intakeResponse.json();
    const sessionId = intakeData.sessionId;

    const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId }),
    });
    
    const sessionData = await sessionResponse.json();
    const session = sessionData.session as Session;
    const items = sessionData.items as ContentItem[];
    
    expect(session.selectedIds.length).toBe(1);
    expect(session.selectedIds[0]).toBe(items[0].id);
  });

  it('does not trigger creator-profile discovery for single-video sessions', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/video/1111111111111111111',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    const intakeData = await intakeResponse.json();
    const sessionId = intakeData.sessionId;

    const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId }),
    });
    
    const sessionData = await sessionResponse.json();
    
    // Should not have candidates array (that's for creator-profile sessions)
    expect(sessionData).not.toHaveProperty('candidates');
    
    // Should have items for preparation
    expect(sessionData).toHaveProperty('items');
    expect(sessionData.items.length).toBe(1);
  });

  it('automatically starts preparation for single-video without manual POST /prepare', async () => {
    // VAL-PREP-002: Single-video preparation auto-starts with exactly one item
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/video/7777777777777777777',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    const intakeData = await intakeResponse.json();
    const sessionId = intakeData.sessionId;

    // Load session - this should trigger hydration AND auto-start preparation
    const sessionRequest = new Request(`http://localhost/api/sessions/${sessionId}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId }),
    });
    
    expect(sessionResponse.status).toBe(200);
    const sessionData = await sessionResponse.json();
    const items = sessionData.items as ContentItem[];
    expect(items.length).toBe(1);
    
    const itemId = items[0].id;
    
    // Wait for background preparation to progress
    // FixturePreparationAdapter has 100ms delays per status transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify preparation has started automatically (status should have progressed)
    const updatedItem = await loadItem(sessionId, itemId);
    expect(updatedItem).not.toBeNull();
    expect(updatedItem?.prepStatus).not.toBe('pending');
    // Status should be one of: downloading, transcribing, ready, or failed
    expect(['downloading', 'transcribing', 'ready', 'failed']).toContain(updatedItem?.prepStatus);
  });
});
