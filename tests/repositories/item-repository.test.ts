/**
 * Item Repository Tests
 * 
 * Tests owner-scoped item access patterns for hosted persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  saveItem,
  loadOwnedItem,
  loadOwnedItems,
  updateItemPrepStatus,
} from '@/lib/repositories/item-repository';
import type { ContentItem } from '@/lib/domain/types';
import { generateContentItemId, generateSessionId } from '@/lib/domain/ids';
import { fileExists } from '@/lib/utils/fs';
import { getItemFile } from '@/lib/utils/paths';
import { promises as fs } from 'fs';

describe('item-repository', () => {
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
    prepStatus: 'pending',
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

  describe('saveItem', () => {
    it('should save item with owner association', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      // Verify filesystem persistence
      const itemFile = getItemFile(sessionId, itemId);
      expect(await fileExists(itemFile)).toBe(true);
    });
  });

  describe('loadOwnedItem', () => {
    it('should return null for non-existent item', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const result = await loadOwnedItem(userId1, sessionId, 'non-existent');
      expect(result).toBeNull();
    });

    it('should load item for the owner', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      const result = await loadOwnedItem(userId1, sessionId, itemId);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(itemId);
      expect(result?.source.title).toBe('Test Video');
    });

    it('should return null for non-owner', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      // User2 tries to load user1's item
      const result = await loadOwnedItem(userId2, sessionId, itemId);
      expect(result).toBeNull();
    });
  });

  describe('loadOwnedItems', () => {
    it('should return empty array when no items exist', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const result = await loadOwnedItems(userId1, sessionId);
      expect(result).toEqual([]);
    });

    it('should return only items from owned session', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      const item1 = { ...testItem, id: generateContentItemId() };
      const item2 = { ...testItem, id: generateContentItemId() };
      
      await saveItem(item1, userId1);
      await saveItem(item2, userId1);
      
      const items = await loadOwnedItems(userId1, sessionId);
      expect(items).toHaveLength(2);
      expect(items.map(i => i.id).sort()).toEqual([item1.id, item2.id].sort());
    });

    it('should not return items from non-owned session', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      // User2 tries to load user1's items
      const items = await loadOwnedItems(userId2, sessionId);
      expect(items).toEqual([]);
    });
  });

  describe('updateItemPrepStatus', () => {
    it('should update prep status for owned item', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      await updateItemPrepStatus(userId1, sessionId, itemId, 'ready');
      
      const updated = await loadOwnedItem(userId1, sessionId, itemId);
      expect(updated?.prepStatus).toBe('ready');
    });

    it('should throw error when updating non-owned item', async () => {
      vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => false }));
      
      await saveItem(testItem, userId1);
      
      // User2 tries to update user1's item
      await expect(
        updateItemPrepStatus(userId2, sessionId, itemId, 'ready')
      ).rejects.toThrow(/not found|unauthorized/i);
    });
  });
});
