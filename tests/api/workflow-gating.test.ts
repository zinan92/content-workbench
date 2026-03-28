/**
 * Tests for workflow gating and navigation preservation
 * 
 * Coverage:
 * - VAL-CROSS-001: Creator flow follows intake -> candidate review -> preparation
 * - VAL-CROSS-002: Only ready items expose a working path into studio
 * - VAL-CROSS-003: Failed item does not block continuing with another ready item
 * - VAL-CROSS-004: Single-video flow follows intake -> preparation -> studio
 * - VAL-CROSS-005: Refresh and navigation preserve workflow progress
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST as intakePost } from '@/app/api/intake/route';
import { GET as sessionGet } from '@/app/api/sessions/[sessionId]/route';
import { GET as itemGet } from '@/app/api/items/[itemId]/route';
import { POST as preparePost } from '@/app/api/sessions/[sessionId]/prepare/route';
import { saveWorkspace, loadSession } from '@/lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '@/lib/domain/ids';
import type { Session, ContentItem, Workspace } from '@/lib/domain/types';

let testDataDir: string;

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'workflow-gating-test-'));
  process.env.DATA_ROOT = testDataDir;
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
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
    workflowPhase: 'discovery',
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
      sourceUrl: 'https://www.douyin.com/video/test',
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

describe('VAL-CROSS-001: Creator flow follows intake -> candidate review -> preparation in order', () => {
  it('routes creator-profile intake to session page (candidate review)', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/user/MS4wLjABAAAA1234567890',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    expect(intakeResponse.status).toBe(200);

    const intakeData = await intakeResponse.json();
    expect(intakeData.success).toBe(true);
    expect(intakeData.inputType).toBe('creator-profile');
    
    // VAL-CROSS-001: Creator intake routes to /sessions/:id for candidate review
    expect(intakeData.nextRoute).toMatch(/^\/sessions\//);
    
    const sessionId = intakeData.sessionId;
    expect(intakeData.nextRoute).toBe(`/sessions/${sessionId}`);
  });

  it('sets workflow phase to discovery for creator-profile sessions', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/user/MS4wLjABAAAAtest',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    const intakeData = await intakeResponse.json();
    const sessionId = intakeData.sessionId;

    const session = await loadSession(sessionId);
    expect(session).not.toBeNull();
    expect(session?.workflowPhase).toBe('discovery');
  });

  it('does not initiate preparation before explicit selection', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    
    // Simulate discovered candidates that haven't been selected yet
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id],
        selectedIds: [], // Nothing selected yet
        workflowPhase: 'discovery',
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
      },
    };
    
    await saveWorkspace(workspace);

    // Load session - should return candidates without starting prep
    const sessionRequest = new Request(`http://localhost/api/sessions/${session.id}`);
    const sessionResponse = await sessionGet(sessionRequest, {
      params: Promise.resolve({ sessionId: session.id }),
    });
    
    expect(sessionResponse.status).toBe(200);
    const sessionData = await sessionResponse.json();
    
    // Should have candidates for review
    expect(sessionData).toHaveProperty('candidates');
    expect(sessionData.candidates).toHaveLength(2);
    
    // Items should still be pending, not started
    expect(sessionData.candidates[0].prepStatus).toBe('pending');
    expect(sessionData.candidates[1].prepStatus).toBe('pending');
  });

  it('transitions to preparation only after explicit prepare action', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id],
        selectedIds: [item1.id], // Selected one item
        workflowPhase: 'selection',
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
      },
    };
    
    await saveWorkspace(workspace);

    // Call prepare endpoint
    const prepareRequest = new Request(`http://localhost/api/sessions/${session.id}/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const prepareResponse = await preparePost(prepareRequest, {
      params: Promise.resolve({ sessionId: session.id }),
    });
    
    expect(prepareResponse.status).toBe(200);
    
    // Check workflow phase transitioned to preparation
    const updatedSession = await loadSession(session.id);
    expect(updatedSession?.workflowPhase).toBe('preparation');
  });
});

describe('VAL-CROSS-002: Only ready items expose a working path into studio', () => {
  it('blocks studio access for pending items with 403', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, { prepStatus: 'pending' });
    
    const workspace: Workspace = {
      session,
      items: { [item.id]: item },
    };
    
    await saveWorkspace(workspace);

    const itemRequest = new Request(`http://localhost/api/items/${item.id}`);
    const itemResponse = await itemGet(itemRequest, {
      params: Promise.resolve({ itemId: item.id }),
    });
    
    expect(itemResponse.status).toBe(403);
    const data = await itemResponse.json();
    expect(data.error).toContain('not ready');
  });

  it('blocks studio access for downloading items with 403', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, { prepStatus: 'downloading' });
    
    const workspace: Workspace = {
      session,
      items: { [item.id]: item },
    };
    
    await saveWorkspace(workspace);

    const itemRequest = new Request(`http://localhost/api/items/${item.id}`);
    const itemResponse = await itemGet(itemRequest, {
      params: Promise.resolve({ itemId: item.id }),
    });
    
    expect(itemResponse.status).toBe(403);
  });

  it('blocks studio access for transcribing items with 403', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, { prepStatus: 'transcribing' });
    
    const workspace: Workspace = {
      session,
      items: { [item.id]: item },
    };
    
    await saveWorkspace(workspace);

    const itemRequest = new Request(`http://localhost/api/items/${item.id}`);
    const itemResponse = await itemGet(itemRequest, {
      params: Promise.resolve({ itemId: item.id }),
    });
    
    expect(itemResponse.status).toBe(403);
  });

  it('blocks studio access for failed items with 403', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Download failed',
    });
    
    const workspace: Workspace = {
      session,
      items: { [item.id]: item },
    };
    
    await saveWorkspace(workspace);

    const itemRequest = new Request(`http://localhost/api/items/${item.id}`);
    const itemResponse = await itemGet(itemRequest, {
      params: Promise.resolve({ itemId: item.id }),
    });
    
    expect(itemResponse.status).toBe(403);
  });

  it('allows studio access for ready items with 200', async () => {
    const session = createTestSession();
    const item = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/path/to/video.mp4',
        transcriptPath: '/path/to/transcript.txt',
      },
    });
    
    const workspace: Workspace = {
      session,
      items: { [item.id]: item },
    };
    
    await saveWorkspace(workspace);

    const itemRequest = new Request(`http://localhost/api/items/${item.id}`);
    const itemResponse = await itemGet(itemRequest, {
      params: Promise.resolve({ itemId: item.id }),
    });
    
    expect(itemResponse.status).toBe(200);
    const data = await itemResponse.json();
    expect(data.item).toBeDefined();
    expect(data.item.id).toBe(item.id);
    expect(data.item.prepStatus).toBe('ready');
  });
});

describe('VAL-CROSS-003: Failed item does not block continuing with another ready item', () => {
  it('allows ready item access even when other items have failed', async () => {
    const session = createTestSession();
    const failedItem = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Network error',
    });
    const readyItem = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/path/to/video.mp4',
      },
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [failedItem.id, readyItem.id],
        workflowPhase: 'preparation',
      },
      items: {
        [failedItem.id]: failedItem,
        [readyItem.id]: readyItem,
      },
    };
    
    await saveWorkspace(workspace);

    // Should be able to access ready item
    const readyRequest = new Request(`http://localhost/api/items/${readyItem.id}`);
    const readyResponse = await itemGet(readyRequest, {
      params: Promise.resolve({ itemId: readyItem.id }),
    });
    
    expect(readyResponse.status).toBe(200);
    
    // Failed item should be blocked
    const failedRequest = new Request(`http://localhost/api/items/${failedItem.id}`);
    const failedResponse = await itemGet(failedRequest, {
      params: Promise.resolve({ itemId: failedItem.id }),
    });
    
    expect(failedResponse.status).toBe(403);
  });

  it('provides other ready items for next-video navigation', async () => {
    const session = createTestSession();
    const failedItem = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Download timeout',
    });
    const readyItem1 = createTestItem(session.id, {
      prepStatus: 'ready',
      source: {
        title: 'Ready Video 1',
        sourceUrl: 'https://www.douyin.com/video/1',
      },
    });
    const readyItem2 = createTestItem(session.id, {
      prepStatus: 'ready',
      source: {
        title: 'Ready Video 2',
        sourceUrl: 'https://www.douyin.com/video/2',
      },
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [failedItem.id, readyItem1.id, readyItem2.id],
        workflowPhase: 'preparation',
      },
      items: {
        [failedItem.id]: failedItem,
        [readyItem1.id]: readyItem1,
        [readyItem2.id]: readyItem2,
      },
    };
    
    await saveWorkspace(workspace);

    // Access first ready item
    const item1Request = new Request(`http://localhost/api/items/${readyItem1.id}`);
    const item1Response = await itemGet(item1Request, {
      params: Promise.resolve({ itemId: readyItem1.id }),
    });
    
    expect(item1Response.status).toBe(200);
    const item1Data = await item1Response.json();
    
    // Should include the other ready item (not the failed one) in otherReadyItems
    expect(item1Data.otherReadyItems).toBeDefined();
    expect(item1Data.otherReadyItems).toHaveLength(1);
    expect(item1Data.otherReadyItems[0].id).toBe(readyItem2.id);
    expect(item1Data.otherReadyItems[0].title).toBe('Ready Video 2');
  });
});

describe('VAL-CROSS-004: Single-video flow follows intake -> preparation -> studio', () => {
  it('routes single-video intake to session page which should redirect to preparation', async () => {
    const intakeRequest = new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: 'https://www.douyin.com/video/7234567890123456789',
      }),
    });

    const intakeResponse = await intakePost(intakeRequest);
    expect(intakeResponse.status).toBe(200);

    const intakeData = await intakeResponse.json();
    expect(intakeData.success).toBe(true);
    expect(intakeData.inputType).toBe('single-video');
    
    // Routes to session page initially (client will redirect to preparation)
    expect(intakeData.nextRoute).toMatch(/^\/sessions\//);
    
    const sessionId = intakeData.sessionId;
    
    // Load session - should have preparation phase
    const session = await loadSession(sessionId);
    expect(session?.workflowPhase).toBe('preparation');
  });

  it('does not expose candidates array for single-video sessions', async () => {
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
    
    expect(sessionResponse.status).toBe(200);
    const sessionData = await sessionResponse.json();
    
    // Single-video sessions should not have candidates property
    expect(sessionData).not.toHaveProperty('candidates');
    expect(sessionData).toHaveProperty('items');
    expect(sessionData).toHaveProperty('session');
    expect(sessionData.session.inputType).toBe('single-video');
  });
});

describe('VAL-CROSS-005: Refresh and navigation preserve workflow progress', () => {
  it('preserves candidate selection across session reloads', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    const item3 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id, item3.id],
        selectedIds: [item1.id, item3.id], // Selected specific items
        workflowPhase: 'selection',
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
        [item3.id]: item3,
      },
    };
    
    await saveWorkspace(workspace);

    // First load
    const request1 = new Request(`http://localhost/api/sessions/${session.id}`);
    const response1 = await sessionGet(request1, {
      params: Promise.resolve({ sessionId: session.id }),
    });
    
    const data1 = await response1.json();
    expect(data1.session.selectedIds).toEqual([item1.id, item3.id]);
    
    // Second load (simulating refresh)
    const request2 = new Request(`http://localhost/api/sessions/${session.id}`);
    const response2 = await sessionGet(request2, {
      params: Promise.resolve({ sessionId: session.id }),
    });
    
    const data2 = await response2.json();
    expect(data2.session.selectedIds).toEqual([item1.id, item3.id]);
  });

  it('preserves preparation status across session reloads', async () => {
    const session = createTestSession();
    const pendingItem = createTestItem(session.id, { prepStatus: 'pending' });
    const readyItem = createTestItem(session.id, {
      prepStatus: 'ready',
      artifacts: {
        videoPath: '/path/to/video.mp4',
        transcriptPath: '/path/to/transcript.txt',
      },
    });
    const failedItem = createTestItem(session.id, {
      prepStatus: 'failed',
      prepFailureReason: 'Timeout',
    });
    
    const workspace: Workspace = {
      session: {
        ...session,
        selectedIds: [pendingItem.id, readyItem.id, failedItem.id],
        workflowPhase: 'preparation',
      },
      items: {
        [pendingItem.id]: pendingItem,
        [readyItem.id]: readyItem,
        [failedItem.id]: failedItem,
      },
    };
    
    await saveWorkspace(workspace);

    // Load session multiple times
    for (let i = 0; i < 3; i++) {
      const request = new Request(`http://localhost/api/sessions/${session.id}`);
      const response = await sessionGet(request, {
        params: Promise.resolve({ sessionId: session.id }),
      });
      
      const data = await response.json();
      const items = data.items as ContentItem[];
      
      const pending = items.find((item) => item.id === pendingItem.id);
      const ready = items.find((item) => item.id === readyItem.id);
      const failed = items.find((item) => item.id === failedItem.id);
      
      expect(pending?.prepStatus).toBe('pending');
      expect(ready?.prepStatus).toBe('ready');
      expect(ready?.artifacts?.videoPath).toBe('/path/to/video.mp4');
      expect(failed?.prepStatus).toBe('failed');
      expect(failed?.prepFailureReason).toBe('Timeout');
    }
  });

  it('preserves workflow phase across session reloads', async () => {
    const session = createTestSession({ workflowPhase: 'preparation' });
    const item = createTestItem(session.id);
    
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

    // Load multiple times
    for (let i = 0; i < 3; i++) {
      const request = new Request(`http://localhost/api/sessions/${session.id}`);
      const response = await sessionGet(request, {
        params: Promise.resolve({ sessionId: session.id }),
      });
      
      const data = await response.json();
      expect(data.session.workflowPhase).toBe('preparation');
    }
  });

  it('preserves partial discovery flag across reloads', async () => {
    const session = createTestSession({
      workflowPhase: 'discovery',
      isPartialDiscovery: true,
    });
    const item = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item.id],
      },
      items: {
        [item.id]: item,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(`http://localhost/api/sessions/${session.id}`);
    const response = await sessionGet(request, {
      params: Promise.resolve({ sessionId: session.id }),
    });
    
    const data = await response.json();
    expect(data.isPartial).toBe(true);
    expect(data.session.isPartialDiscovery).toBe(true);
  });
});
