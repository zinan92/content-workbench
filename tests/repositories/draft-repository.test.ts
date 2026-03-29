/**
 * Draft Repository Tests
 * 
 * Tests owner-scoped draft access patterns for hosted persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  updatePlatformDraft,
  loadOwnedItemWithDrafts,
} from '@/lib/repositories/draft-repository';
import type { ContentItem, PlatformDraft } from '@/lib/domain/types';
import { generateContentItemId, generateSessionId } from '@/lib/domain/ids';
import { fileExists } from '@/lib/utils/fs';
import { getItemFile } from '@/lib/utils/paths';
import { promises as fs } from 'fs';

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
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      // First, we need to save the item via item-repository
      const { saveItem } = await import('@/lib/repositories/item-repository');
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
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const { saveItem } = await import('@/lib/repositories/item-repository');
      await saveItem(testItem, userId1);
      
      // User2 tries to update user1's draft
      await expect(
        updatePlatformDraft(userId2, sessionId, itemId, testDraft)
      ).rejects.toThrow(/not found|unauthorized/i);
    });

    it('should throw error when updating draft for non-ready item', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const pendingItem = { ...testItem, prepStatus: 'pending' as const };
      const { saveItem } = await import('@/lib/repositories/item-repository');
      await saveItem(pendingItem, userId1);
      
      await expect(
        updatePlatformDraft(userId1, sessionId, itemId, testDraft)
      ).rejects.toThrow(/not ready/i);
    });
  });

  describe('loadOwnedItemWithDrafts', () => {
    it('should load item with drafts for owner', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const { saveItem } = await import('@/lib/repositories/item-repository');
      await saveItem(testItem, userId1);
      await updatePlatformDraft(userId1, sessionId, itemId, testDraft);
      
      const result = await loadOwnedItemWithDrafts(userId1, itemId);
      expect(result).not.toBeNull();
      expect(result?.platformDrafts.xiaohongshu).toBeDefined();
    });

    it('should return null for non-owner', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const { saveItem } = await import('@/lib/repositories/item-repository');
      await saveItem(testItem, userId1);
      await updatePlatformDraft(userId1, sessionId, itemId, testDraft);
      
      // User2 tries to load user1's item with drafts
      const result = await loadOwnedItemWithDrafts(userId2, itemId);
      expect(result).toBeNull();
    });
  });
});
