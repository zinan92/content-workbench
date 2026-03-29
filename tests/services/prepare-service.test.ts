/**
 * Tests for Preparation Service
 * 
 * Coverage:
 * - Item preparation lifecycle: pending → downloading → transcribing → ready
 * - Isolated item failures: one failure doesn't block others
 * - Persisted artifact paths after successful preparation
 * - Status transitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareItems } from '../../lib/services/prepare-service';
import { saveSession, saveItem, loadOwnedItem } from '../../lib/repositories';
import { generateSessionId, generateContentItemId } from '../../lib/domain/ids';
import type { Session, ContentItem } from '../../lib/domain/types';

// Mock feature flag to use filesystem persistence for tests
vi.mock('@/lib/config/env', () => ({
  useHostedPersistence: vi.fn(() => false),
  useHostedStorage: vi.fn(() => false),
  useHostedWorker: vi.fn(() => false),
  getSupabaseUrl: vi.fn(() => 'http://localhost:54321'),
  getSupabasePublishableKey: vi.fn(() => 'test-key'),
}));

let testDataDir: string;

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'prepare-service-test-'));
  process.env.DATA_ROOT = testDataDir;
  // Default to fixture mode for stable tests
  delete process.env.CONTENT_WORKBENCH_PREP_MODE;
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
  delete process.env.CONTENT_WORKBENCH_PREP_MODE;
});

function createTestSession(overrides?: Partial<Session>): Session {
  const now = new Date().toISOString();
  const id = generateSessionId();
  
  return {
    id,
    inputLink: 'https://www.douyin.com/user/test',
    inputType: 'creator-profile',
    candidateIds: [],
    selectedIds: [],
    workflowPhase: 'preparation',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createTestItem(sessionId: string, overrides?: Partial<ContentItem>): ContentItem {
  const now = new Date().toISOString();
  return {
    id: generateContentItemId(),
    sessionId,
    source: {
      title: 'Test Video',
      sourceUrl: 'https://www.douyin.com/video/test123',
    },
    simpleScore: 50,
    recommended: false,
    prepStatus: 'pending',
    platformDrafts: {} as ContentItem['platformDrafts'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('prepareItems', () => {
  const testUserId = 'test-user-123';

  it('should transition item from pending to ready', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id);
    
    // Save using repository functions with userId
    await saveSession(session, testUserId);
    await saveItem(item, testUserId);

    // Prepare the item
    await prepareItems(session.id, [item.id], testUserId);

    // Check item reached ready state
    const updatedItem = await loadOwnedItem(testUserId, session.id, item.id);
    expect(updatedItem?.prepStatus).toBe('ready');
  });

  it('should populate artifact paths when item becomes ready', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id);
    
    await saveSession(session, testUserId);
    await saveItem(item, testUserId);

    await prepareItems(session.id, [item.id], testUserId);

    const updatedItem = await loadOwnedItem(testUserId, session.id, item.id);
    expect(updatedItem?.artifacts).toBeDefined();
    expect(updatedItem?.artifacts?.videoPath).toBeTruthy();
  });

  it('should handle multiple items independently', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    
    await saveSession(session, testUserId);
    await saveItem(item1, testUserId);
    await saveItem(item2, testUserId);

    await prepareItems(session.id, [item1.id, item2.id], testUserId);

    const updatedItem1 = await loadOwnedItem(testUserId, session.id, item1.id);
    const updatedItem2 = await loadOwnedItem(testUserId, session.id, item2.id);
    
    expect(updatedItem1?.prepStatus).toBe('ready');
    expect(updatedItem2?.prepStatus).toBe('ready');
  });

  it('should isolate failures so one failed item does not block others', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id, {
      source: {
        title: 'Good Video',
        sourceUrl: 'https://www.douyin.com/video/good123',
      },
    });
    const item2 = createTestItem(session.id, {
      source: {
        title: 'Bad Video',
        sourceUrl: 'https://www.douyin.com/video/FAIL_ME',
      },
    });
    
    await saveSession(session, testUserId);
    await saveItem(item1, testUserId);
    await saveItem(item2, testUserId);

    // Set mode to cause failures for specific URLs
    process.env.CONTENT_WORKBENCH_PREP_MODE = 'mixed-outcomes';

    await prepareItems(session.id, [item1.id, item2.id], testUserId);

    const updatedItem1 = await loadOwnedItem(testUserId, session.id, item1.id);
    const updatedItem2 = await loadOwnedItem(testUserId, session.id, item2.id);
    
    // item1 should succeed
    expect(updatedItem1?.prepStatus).toBe('ready');
    expect(updatedItem1?.artifacts?.videoPath).toBeTruthy();
    
    // item2 should fail but not block item1
    expect(updatedItem2?.prepStatus).toBe('failed');
    expect(updatedItem2?.prepFailureReason).toBeTruthy();
    expect(updatedItem2?.artifacts).toBeUndefined();
  });

  it('should set failure reason when item fails', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      source: {
        title: 'Fail Video',
        sourceUrl: 'https://www.douyin.com/video/FAIL_ME',
      },
    });
    
    await saveSession(session, testUserId);
    await saveItem(item, testUserId);

    process.env.CONTENT_WORKBENCH_PREP_MODE = 'mixed-outcomes';

    await prepareItems(session.id, [item.id], testUserId);

    const updatedItem = await loadOwnedItem(testUserId, session.id, item.id);
    expect(updatedItem?.prepStatus).toBe('failed');
    expect(updatedItem?.prepFailureReason).toContain('Failed');
  });

  it('should handle empty item list gracefully', async () => {
    const session = createTestSession();
    
    await saveSession(session, testUserId);

    // Should not throw
    await expect(prepareItems(session.id, [], testUserId)).resolves.not.toThrow();
  });

  it('should preserve existing artifacts when retrying a ready item', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/existing/video.mp4',
        transcriptPath: '/existing/transcript.txt',
      },
    });
    
    await saveSession(session, testUserId);
    await saveItem(item, testUserId);

    await prepareItems(session.id, [item.id], testUserId);

    const updatedItem = await loadOwnedItem(testUserId, session.id, item.id);
    // Should remain ready with artifacts
    expect(updatedItem?.prepStatus).toBe('ready');
    expect(updatedItem?.artifacts?.videoPath).toBeTruthy();
  });
});
