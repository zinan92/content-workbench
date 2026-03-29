/**
 * Draft Repository Tests
 * 
 * Tests owner-scoped draft access patterns for hosted persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ContentItem, PlatformDraft } from '@/lib/domain/types';
import { generateContentItemId, generateSessionId } from '@/lib/domain/ids';
import { fileExists } from '@/lib/utils/fs';
import { getItemFile } from '@/lib/utils/paths';
import { promises as fs } from 'fs';

// Mock feature flag to use filesystem persistence for tests
vi.mock('@/lib/config/env', () => ({
  useHostedPersistence: vi.fn(() => false),
  useHostedStorage: vi.fn(() => false),
  useHostedWorker: vi.fn(() => false),
  getSupabaseUrl: vi.fn(() => 'http://localhost:54321'),
  getSupabasePublishableKey: vi.fn(() => 'test-key'),
}));

// Import after mocking
const { 
  loadOwnedItemWithDrafts,
  updatePlatformDraft,
// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@/lib/repositories/draft-repository');

// Also need to import session and item repositories for setup
const {
  saveSession,
// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@/lib/repositories/session-repository');

const {
  saveItem,
// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@/lib/repositories/item-repository');

describe('draft-repository', () => {
  const userId1 = 'user-123';
  const userId2 = 'user-456';
  const sessionId = generateSessionId();
  const itemId = generateContentItemId();
  
  const testItem: ContentItem = {
    id: itemId,
    sessionId: sessionId,
    source: {
      title: 'Test Video',
      sourceUrl: 'https://www.douyin.com/video/test',
    },
    simpleScore: 75,
    recommended: true,
    prepStatus: 'ready',
    platformDrafts: {
      xiaohongshu: { platform: 'xiaohongshu', title: '', body: '', checklist: {}, lastUpdated: new Date().toISOString() },
      bilibili: { platform: 'bilibili', title: '', body: '', checklist: {}, lastUpdated: new Date().toISOString() },
      'video-channel': { platform: 'video-channel', title: '', body: '', checklist: {}, lastUpdated: new Date().toISOString() },
      'wechat-oa': { platform: 'wechat-oa', title: '', body: '', checklist: {}, lastUpdated: new Date().toISOString() },
      x: { platform: 'x', title: '', body: '', checklist: {}, lastUpdated: new Date().toISOString() },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testDraft: PlatformDraft = {
    platform: 'xiaohongshu',
    title: 'Test Title',
    body: 'Test Body',
    checklist: { 'step1': false },
    lastUpdated: new Date().toISOString(),
  };

  // Helper to create a test session
  const createTestSession = async (userId: string) => {
    const session = {
      id: sessionId,
      inputLink: 'https://www.douyin.com/user/test',
      inputType: 'creator-profile' as const,
      candidateIds: [],
      selectedIds: [],
      workflowPhase: 'intake' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveSession(session, userId);
  };

  beforeEach(async () => {
    // Clean up test items before each test
    const itemFile = getItemFile(sessionId, itemId);
    try {
      if (await fileExists(itemFile)) {
        await fs.unlink(itemFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Clean up test items after each test
    const itemFile = getItemFile(sessionId, itemId);
    try {
      if (await fileExists(itemFile)) {
        await fs.unlink(itemFile);
      }
    } catch {
      // Ignore cleanup errors
    }
    vi.restoreAllMocks();
  });

  describe('updatePlatformDraft', () => {
    it('should update draft for owned ready item', async () => {
      await createTestSession(userId1);
      await saveItem(testItem, userId1);
      
      // Update draft
      await updatePlatformDraft(userId1, sessionId, itemId, testDraft);
      
      // Verify draft was saved
      const updated = await loadOwnedItemWithDrafts(userId1, itemId);
      expect(updated).not.toBeNull();
      expect(updated?.platformDrafts.xiaohongshu).toBeDefined();
      expect(updated?.platformDrafts.xiaohongshu.title).toBe('Test Title');
    });

    it('should throw error when updating draft for non-owned item', async () => {
      await createTestSession(userId1);
      await saveItem(testItem, userId1);
      
      // User2 tries to update user1's draft
      await expect(
        updatePlatformDraft(userId2, sessionId, itemId, testDraft)
      ).rejects.toThrow(/not found|unauthorized/i);
    });

    it('should throw error when updating draft for non-ready item', async () => {
      await createTestSession(userId1);
      const pendingItem = { ...testItem, prepStatus: 'pending' as const };
      await saveItem(pendingItem, userId1);
      
      await expect(
        updatePlatformDraft(userId1, sessionId, itemId, testDraft)
      ).rejects.toThrow(/not ready/i);
    });
  });

  describe('loadOwnedItemWithDrafts', () => {
    it('should load item with drafts for owner', async () => {
      await createTestSession(userId1);
      await saveItem(testItem, userId1);
      await updatePlatformDraft(userId1, sessionId, itemId, testDraft);
      
      const result = await loadOwnedItemWithDrafts(userId1, itemId);
      expect(result).not.toBeNull();
      expect(result?.platformDrafts.xiaohongshu).toBeDefined();
    });

    it('should return null for non-owner', async () => {
      await createTestSession(userId1);
      await saveItem(testItem, userId1);
      await updatePlatformDraft(userId1, sessionId, itemId, testDraft);
      
      // User2 tries to load user1's item with drafts
      const result = await loadOwnedItemWithDrafts(userId2, itemId);
      expect(result).toBeNull();
    });
  });
});
