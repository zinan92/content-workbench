/**
 * Tests for item draft persistence API route
 * 
 * Feature: studio-draft-persistence-checklists-and-next-steps
 * 
 * This test suite covers:
 * - VAL-STUDIO-005: Checklist state is tracked independently per platform
 * - VAL-STUDIO-006: Draft edits and checklist state persist across tab switches and reload
 * - VAL-STUDIO-007: Manual editing remains available when generated content is sparse
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET, POST } from '@/app/api/items/[itemId]/drafts/route';
import { saveWorkspace, loadWorkspace } from '@/lib/services/workspace-store';
import type { ContentItem, Workspace } from '@/lib/domain/types';
import { unlinkSync } from 'fs';
import { getWorkspaceFile } from '@/lib/utils/paths';

// Helper to create a mock ready item
function createMockReadyItem(itemId: string, sessionId: string): ContentItem {
  return {
    id: itemId,
    sessionId,
    source: {
      title: 'Test Video',
      sourceUrl: 'https://www.douyin.com/video/test123',
      duration: 120,
    },
    simpleScore: 75,
    recommended: true,
    prepStatus: 'ready',
    artifacts: {
      videoPath: '/data/test/video.mp4',
      transcriptPath: '/data/test/transcript.json',
    },
    platformDrafts: {
      xiaohongshu: {
        platform: 'xiaohongshu',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: new Date().toISOString(),
      },
      bilibili: {
        platform: 'bilibili',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: new Date().toISOString(),
      },
      'video-channel': {
        platform: 'video-channel',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: new Date().toISOString(),
      },
      'wechat-oa': {
        platform: 'wechat-oa',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: new Date().toISOString(),
      },
      x: {
        platform: 'x',
        title: '',
        body: '',
        checklist: {},
        lastUpdated: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Helper to create test workspace
async function createTestWorkspace(sessionId: string, itemId: string): Promise<Workspace> {
  const workspace: Workspace = {
    session: {
      id: sessionId,
      inputLink: 'https://www.douyin.com/video/test123',
      inputType: 'single-video',
      candidateIds: [itemId],
      selectedIds: [itemId],
      workflowPhase: 'studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: {
      [itemId]: createMockReadyItem(itemId, sessionId),
    },
  };

  await saveWorkspace(workspace);
  return workspace;
}

// Helper to clean up test data
async function cleanupTestData(sessionId: string) {
  try {
    unlinkSync(getWorkspaceFile(sessionId));
  } catch {
    // Ignore if doesn't exist
  }
}

describe('POST /api/items/[itemId]/drafts - Save platform draft', () => {
  const sessionId = 'test-session-drafts';
  const itemId = 'test-item-drafts';

  beforeAll(async () => {
    await createTestWorkspace(sessionId, itemId);
  });

  afterAll(async () => {
    await cleanupTestData(sessionId);
  });

  it('saves draft edits for a specific platform', async () => {
    const request = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'xiaohongshu',
        title: 'My XHS Title',
        body: 'My XHS caption text',
        coverNotes: 'Cover image notes',
        checklist: {},
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ itemId }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify persistence
    const workspace = await loadWorkspace(sessionId);
    expect(workspace?.items[itemId].platformDrafts.xiaohongshu.title).toBe('My XHS Title');
    expect(workspace?.items[itemId].platformDrafts.xiaohongshu.body).toBe('My XHS caption text');
    expect(workspace?.items[itemId].platformDrafts.xiaohongshu.coverNotes).toBe('Cover image notes');
  });

  it('saves independent checklist state per platform', async () => {
    // Save checklist for XiaoHongShu
    const xhsRequest = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'xiaohongshu',
        title: 'XHS',
        body: 'XHS body',
        checklist: {
          'cover-uploaded': true,
          'tags-added': true,
        },
      }),
    });

    await POST(xhsRequest, { params: Promise.resolve({ itemId }) });

    // Save different checklist for Bilibili
    const biliRequest = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'bilibili',
        title: 'Bili',
        body: 'Bili body',
        checklist: {
          'cover-uploaded': true,
          'tags-added': false,
          'submitted': true,
        },
      }),
    });

    await POST(biliRequest, { params: Promise.resolve({ itemId }) });

    // Verify both checklists are independent
    const workspace = await loadWorkspace(sessionId);
    const xhsChecklist = workspace?.items[itemId].platformDrafts.xiaohongshu.checklist;
    const biliChecklist = workspace?.items[itemId].platformDrafts.bilibili.checklist;

    expect(xhsChecklist).toEqual({
      'cover-uploaded': true,
      'tags-added': true,
    });

    expect(biliChecklist).toEqual({
      'cover-uploaded': true,
      'tags-added': false,
      'submitted': true,
    });
  });

  it('preserves draft state across multiple saves to same platform', async () => {
    // First save
    const request1 = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'x',
        title: 'Draft 1',
        body: 'Body 1',
        checklist: { step1: true },
      }),
    });

    await POST(request1, { params: Promise.resolve({ itemId }) });

    // Second save updates the same platform
    const request2 = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'x',
        title: 'Draft 2',
        body: 'Body 2',
        checklist: { step1: true, step2: true },
      }),
    });

    await POST(request2, { params: Promise.resolve({ itemId }) });

    // Verify latest state
    const workspace = await loadWorkspace(sessionId);
    const xDraft = workspace?.items[itemId].platformDrafts.x;

    expect(xDraft?.title).toBe('Draft 2');
    expect(xDraft?.body).toBe('Body 2');
    expect(xDraft?.checklist).toEqual({ step1: true, step2: true });
  });

  it('allows saving sparse or empty content', async () => {
    const request = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'video-channel',
        title: '',
        body: 'Only body text, no title',
        checklist: {},
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ itemId }) });
    expect(response.status).toBe(200);

    const workspace = await loadWorkspace(sessionId);
    const draft = workspace?.items[itemId].platformDrafts['video-channel'];

    expect(draft?.title).toBe('');
    expect(draft?.body).toBe('Only body text, no title');
  });

  it('updates lastUpdated timestamp on save', async () => {
    const beforeTime = new Date().toISOString();

    const request = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'wechat-oa',
        title: 'Test',
        body: 'Test',
        checklist: {},
      }),
    });

    await POST(request, { params: Promise.resolve({ itemId }) });

    const afterTime = new Date().toISOString();

    const workspace = await loadWorkspace(sessionId);
    const draft = workspace?.items[itemId].platformDrafts['wechat-oa'];

    expect(draft?.lastUpdated).toBeDefined();
    expect(draft!.lastUpdated >= beforeTime).toBe(true);
    expect(draft!.lastUpdated <= afterTime).toBe(true);
  });

  it('returns 404 for non-existent item', async () => {
    const request = new Request('http://localhost/api/items/non-existent-item/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'xiaohongshu',
        title: 'Test',
        body: 'Test',
        checklist: {},
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ itemId: 'non-existent-item' }) });
    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid platform', async () => {
    const request = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'invalid-platform',
        title: 'Test',
        body: 'Test',
        checklist: {},
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ itemId }) });
    expect(response.status).toBe(400);
  });

  it('returns 400 for missing required fields', async () => {
    const request = new Request('http://localhost/api/items/test-item-drafts/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'xiaohongshu',
        // missing title and body
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ itemId }) });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/items/[itemId]/drafts - Load platform drafts', () => {
  const sessionId = 'test-session-drafts-get';
  const itemId = 'test-item-drafts-get';

  beforeAll(async () => {
    const workspace = await createTestWorkspace(sessionId, itemId);
    
    // Pre-populate some draft data
    workspace.items[itemId].platformDrafts.xiaohongshu = {
      platform: 'xiaohongshu',
      title: 'Existing XHS Title',
      body: 'Existing XHS Body',
      coverNotes: 'Existing notes',
      checklist: { step1: true, step2: false },
      lastUpdated: new Date().toISOString(),
    };

    await saveWorkspace(workspace);
  });

  afterAll(async () => {
    await cleanupTestData(sessionId);
  });

  it('returns all platform drafts for an item', async () => {
    const request = new Request('http://localhost/api/items/test-item-drafts-get/drafts', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ itemId }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.drafts).toBeDefined();
    expect(data.drafts.xiaohongshu).toBeDefined();
    expect(data.drafts.xiaohongshu.title).toBe('Existing XHS Title');
    expect(data.drafts.xiaohongshu.body).toBe('Existing XHS Body');
    expect(data.drafts.xiaohongshu.checklist).toEqual({ step1: true, step2: false });
  });

  it('returns 404 for non-existent item', async () => {
    const request = new Request('http://localhost/api/items/non-existent-item/drafts', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ itemId: 'non-existent-item' }) });
    expect(response.status).toBe(404);
  });
});
