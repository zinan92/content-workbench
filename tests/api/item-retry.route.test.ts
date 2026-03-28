/**
 * Tests for Item Retry API
 * 
 * Coverage:
 * - POST /api/sessions/[sessionId]/prepare/[itemId]/retry
 * - Retries a failed item without affecting others
 * - Handles non-existent items/sessions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST } from '@/app/api/sessions/[sessionId]/prepare/[itemId]/retry/route';
import { saveWorkspace, loadItem } from '@/lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '@/lib/domain/ids';
import type { Session, ContentItem, Workspace } from '@/lib/domain/types';

let testDataDir: string;

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'retry-test-'));
  process.env.DATA_ROOT = testDataDir;
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

describe('POST /api/sessions/[sessionId]/prepare/[itemId]/retry', () => {
  it('should retry a failed item and return updated status', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Previous failure',
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [item.id],
      },
      items: {
        [item.id]: item,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(
      `http://localhost:3100/api/sessions/${session.id}/prepare/${item.id}/retry`,
      { method: 'POST' }
    );
    
    const response = await POST(request, {
      params: Promise.resolve({ sessionId: session.id, itemId: item.id })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.itemId).toBe(item.id);
    expect(data.prepStatus).toBe('ready');
  });

  it('should clear failure reason on successful retry', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Download timeout',
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [item.id],
      },
      items: {
        [item.id]: item,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(
      `http://localhost:3100/api/sessions/${session.id}/prepare/${item.id}/retry`,
      { method: 'POST' }
    );
    
    await POST(request, {
      params: Promise.resolve({ sessionId: session.id, itemId: item.id })
    });

    const updatedItem = await loadItem(session.id, item.id);
    expect(updatedItem?.prepStatus).toBe('ready');
    expect(updatedItem?.prepFailureReason).toBeUndefined();
  });

  it('should return 404 for non-existent item', async () => {
    const session = createTestSession();
    const nonExistentItemId = generateContentItemId();
    
    const workspace: Workspace = {
      session,
      items: {},
    };
    
    await saveWorkspace(workspace);

    const request = new Request(
      `http://localhost:3100/api/sessions/${session.id}/prepare/${nonExistentItemId}/retry`,
      { method: 'POST' }
    );
    
    const response = await POST(request, {
      params: Promise.resolve({ sessionId: session.id, itemId: nonExistentItemId })
    });

    expect(response.status).toBe(404);
  });

  it('should not affect other items when retrying one', async () => {
    const session = createTestSession();
    const failedItem = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Download failed',
      source: {
        title: 'Failed Video',
        sourceUrl: 'https://www.douyin.com/video/retry123',
      },
    });
    const readyItem = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/data/ready/video.mp4',
      },
      source: {
        title: 'Ready Video',
        sourceUrl: 'https://www.douyin.com/video/ready123',
      },
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [failedItem.id, readyItem.id],
      },
      items: {
        [failedItem.id]: failedItem,
        [readyItem.id]: readyItem,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(
      `http://localhost:3100/api/sessions/${session.id}/prepare/${failedItem.id}/retry`,
      { method: 'POST' }
    );
    
    await POST(request, {
      params: Promise.resolve({ sessionId: session.id, itemId: failedItem.id })
    });

    // Check that ready item was not affected
    const unchangedItem = await loadItem(session.id, readyItem.id);
    expect(unchangedItem?.prepStatus).toBe('ready');
    expect(unchangedItem?.artifacts?.videoPath).toBe('/data/ready/video.mp4');
  });

  it('should allow retrying a ready item (idempotent)', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/data/existing/video.mp4',
      },
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [item.id],
      },
      items: {
        [item.id]: item,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(
      `http://localhost:3100/api/sessions/${session.id}/prepare/${item.id}/retry`,
      { method: 'POST' }
    );
    
    const response = await POST(request, {
      params: Promise.resolve({ sessionId: session.id, itemId: item.id })
    });

    expect(response.status).toBe(200);
    
    const updatedItem = await loadItem(session.id, item.id);
    expect(updatedItem?.prepStatus).toBe('ready');
    expect(updatedItem?.artifacts).toBeDefined();
  });
});
