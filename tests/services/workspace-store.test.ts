/**
 * Tests for workspace store persistence behavior
 */

import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  saveWorkspace,
  loadWorkspace,
  saveSession,
  loadSession,
  saveItem,
  loadItem,
  loadItems,
  updateSessionSelection,
  updateItemPrepStatus,
  updatePlatformDraft,
  sessionExists,
} from '../../lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '../../lib/domain/ids';
import type { Session, ContentItem, Workspace } from '../../lib/domain/types';

// Test helper to clean up a specific session
async function cleanupSession(sessionId: string) {
  const sessionDir = path.join(process.cwd(), 'data', 'workspaces', sessionId);
  try {
    await fs.rm(sessionDir, { recursive: true, force: true });
  } catch {
    // Ignore if doesn't exist
  }
}

const testSessionIds: string[] = [];

afterEach(async () => {
  // Clean up all test sessions
  await Promise.all(testSessionIds.map(id => cleanupSession(id)));
  testSessionIds.length = 0;
});

/**
 * Create a test session fixture
 */
function createTestSession(overrides?: Partial<Session>): Session {
  const now = new Date().toISOString();
  const id = generateSessionId();
  testSessionIds.push(id);
  return {
    id,
    inputLink: 'https://www.douyin.com/user/test',
    inputType: 'creator-profile',
    candidateIds: [],
    selectedIds: [],
    workflowPhase: 'discovery',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test content item fixture
 */
function createTestItem(sessionId: string, overrides?: Partial<ContentItem>): ContentItem {
  const now = new Date().toISOString();
  const itemId = generateContentItemId();
  
  return {
    id: itemId,
    sessionId,
    source: {
      title: 'Test Video',
      publishDate: now,
      duration: 60,
      likes: 100,
      comments: 10,
      shares: 5,
      sourceUrl: 'https://www.douyin.com/video/test',
      authorName: 'Test Author',
      authorId: 'test-author-id',
    },
    simpleScore: 50,
    recommended: false,
    prepStatus: 'pending',
    platformDrafts: {
      xiaohongshu: {
        platform: 'xiaohongshu',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: now,
      },
      bilibili: {
        platform: 'bilibili',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: now,
      },
      'video-channel': {
        platform: 'video-channel',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: now,
      },
      'wechat-oa': {
        platform: 'wechat-oa',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: now,
      },
      x: {
        platform: 'x',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: now,
      },
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Workspace Store - Save and Load', () => {
  it('should save and load a complete workspace', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id],
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
      },
    };
    
    await saveWorkspace(workspace);
    
    const loaded = await loadWorkspace(session.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.session.id).toBe(session.id);
    expect(loaded?.session.candidateIds).toEqual([item1.id, item2.id]);
    expect(Object.keys(loaded?.items || {})).toHaveLength(2);
    expect(loaded?.items[item1.id]).toEqual(item1);
    expect(loaded?.items[item2.id]).toEqual(item2);
  });

  it('should return null when loading non-existent workspace', async () => {
    const nonExistentId = generateSessionId();
    const loaded = await loadWorkspace(nonExistentId);
    expect(loaded).toBeNull();
  });

  it('should save and load session metadata only', async () => {
    const session = createTestSession();
    await saveSession(session);
    
    const loaded = await loadSession(session.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(session.id);
    expect(loaded?.inputLink).toBe(session.inputLink);
    expect(loaded?.workflowPhase).toBe('discovery');
  });

  it('should save and load individual items', async () => {
    const session = createTestSession();
    await saveSession(session);
    
    const item = createTestItem(session.id);
    await saveItem(item);
    
    const loaded = await loadItem(session.id, item.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(item.id);
    expect(loaded?.source.title).toBe('Test Video');
    expect(loaded?.prepStatus).toBe('pending');
  });

  it('should load all items for a session', async () => {
    const session = createTestSession();
    await saveSession(session);
    
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    const item3 = createTestItem(session.id);
    
    await saveItem(item1);
    await saveItem(item2);
    await saveItem(item3);
    
    const items = await loadItems(session.id);
    expect(items).toHaveLength(3);
    expect(items.map(i => i.id).sort()).toEqual([item1.id, item2.id, item3.id].sort());
  });
});

describe('Workspace Store - Update Operations', () => {
  it('should update session selection', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id],
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
      },
    };
    
    await saveWorkspace(workspace);
    
    // Verify initial state has no selection
    const before = await loadSession(session.id);
    expect(before?.selectedIds).toEqual([]);
    
    // Update selection
    await updateSessionSelection(session.id, [item1.id]);
    
    // Verify selection was persisted
    const loaded = await loadSession(session.id);
    expect(loaded?.selectedIds).toEqual([item1.id]);
    
    // Verify updatedAt is a valid ISO timestamp at or after the initial timestamp
    expect(loaded?.updatedAt).toBeDefined();
    expect(new Date(loaded!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(session.updatedAt).getTime()
    );
  });

  it('should update item prep status to ready', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, { prepStatus: 'pending' });
    
    await saveSession(session);
    await saveItem(item);
    
    // Update to downloading
    await updateItemPrepStatus(session.id, item.id, 'downloading');
    let loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('downloading');
    
    // Update to ready
    await updateItemPrepStatus(session.id, item.id, 'ready');
    loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('ready');
    expect(loaded?.prepFailureReason).toBeUndefined();
  });

  it('should update item prep status to failed with reason', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, { prepStatus: 'downloading' });
    
    await saveSession(session);
    await saveItem(item);
    
    await updateItemPrepStatus(session.id, item.id, 'failed', 'Network timeout');
    
    const loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('failed');
    expect(loaded?.prepFailureReason).toBe('Network timeout');
  });

  it('should update platform draft', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id);
    
    await saveSession(session);
    await saveItem(item);
    
    const draft = {
      platform: 'xiaohongshu' as const,
      title: 'Updated XHS Title',
      body: 'Updated XHS body content',
      checklist: { 'cover-uploaded': true },
      lastUpdated: new Date().toISOString(),
    };
    
    await updatePlatformDraft(session.id, item.id, draft);
    
    const loaded = await loadItem(session.id, item.id);
    expect(loaded?.platformDrafts.xiaohongshu.title).toBe('Updated XHS Title');
    expect(loaded?.platformDrafts.xiaohongshu.body).toBe('Updated XHS body content');
    expect(loaded?.platformDrafts.xiaohongshu.checklist['cover-uploaded']).toBe(true);
  });

  it('should preserve other platform drafts when updating one', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id);
    
    await saveSession(session);
    await saveItem(item);
    
    // Update XHS draft
    const xhsDraft = {
      platform: 'xiaohongshu' as const,
      title: 'XHS Title',
      body: 'XHS body',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    };
    await updatePlatformDraft(session.id, item.id, xhsDraft);
    
    // Update Bilibili draft
    const biliDraft = {
      platform: 'bilibili' as const,
      title: 'Bilibili Title',
      body: 'Bilibili body',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    };
    await updatePlatformDraft(session.id, item.id, biliDraft);
    
    const loaded = await loadItem(session.id, item.id);
    expect(loaded?.platformDrafts.xiaohongshu.title).toBe('XHS Title');
    expect(loaded?.platformDrafts.bilibili.title).toBe('Bilibili Title');
  });
});

describe('Workspace Store - Persistence Semantics', () => {
  it('should persist updates across multiple load cycles', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id);
    
    await saveSession(session);
    await saveItem(item);
    
    // First update
    await updateItemPrepStatus(session.id, item.id, 'downloading');
    let loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('downloading');
    
    // Second update
    await updateItemPrepStatus(session.id, item.id, 'ready');
    loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('ready');
    
    // Third load should still show ready
    loaded = await loadItem(session.id, item.id);
    expect(loaded?.prepStatus).toBe('ready');
  });

  it('should handle concurrent item saves', async () => {
    const session = createTestSession();
    const items = [
      createTestItem(session.id),
      createTestItem(session.id),
      createTestItem(session.id),
    ];
    
    await saveSession(session);
    
    // Save all items concurrently
    await Promise.all(items.map(item => saveItem(item)));
    
    const loaded = await loadItems(session.id);
    expect(loaded).toHaveLength(3);
  });

  it('should check session existence', async () => {
    const session = createTestSession();
    
    expect(await sessionExists(session.id)).toBe(false);
    
    await saveSession(session);
    
    expect(await sessionExists(session.id)).toBe(true);
  });
});

describe('Workspace Store - Error Handling', () => {
  it('should throw when updating non-existent session', async () => {
    const nonExistentId = generateSessionId();
    
    await expect(
      updateSessionSelection(nonExistentId, [])
    ).rejects.toThrow('Session not found');
  });

  it('should throw when updating non-existent item', async () => {
    const session = createTestSession();
    await saveSession(session);
    
    const nonExistentItemId = generateContentItemId();
    
    await expect(
      updateItemPrepStatus(session.id, nonExistentItemId, 'ready')
    ).rejects.toThrow('Item not found');
  });
});
