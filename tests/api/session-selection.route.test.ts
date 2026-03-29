/**
 * Tests for session selection persistence API
 * 
 * Coverage:
 * - PATCH /api/sessions/[sessionId]/selection
 * - Persists selection changes to workspace store
 * - Returns updated session state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PATCH } from '../../app/api/sessions/[sessionId]/selection/route';
import { saveWorkspace } from '../../lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '../../lib/domain/ids';
import type { Session, ContentItem, Workspace } from '../../lib/domain/types';
import { setupAuthMock } from '../utils/auth-mock';

let testDataDir: string;
const testSessionIds: string[] = [];
let authCleanup: () => void;

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'selection-test-'));
  process.env.DATA_ROOT = testDataDir;
  authCleanup = setupAuthMock();
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
  testSessionIds.length = 0;
  authCleanup();
});

function createTestSession(): Session {
  const now = new Date().toISOString();
  const id = generateSessionId();
  testSessionIds.push(id);
  
  return {
    id,
    inputLink: 'https://www.douyin.com/user/test',
    inputType: 'creator-profile',
    candidateIds: [],
    selectedIds: [],
    workflowPhase: 'selection',
    createdAt: now,
    updatedAt: now,
  };
}

function createTestItem(sessionId: string): ContentItem {
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
    platformDrafts: {} as ContentItem['platformDrafts'],
    createdAt: now,
    updatedAt: now,
  };
}

describe('PATCH /api/sessions/[sessionId]/selection', () => {
  it('should update selection and persist to store', async () => {
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

    // Call API to update selection
    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [item1.id] }),
    });
    
    const response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.session.selectedIds).toEqual([item1.id]);
  });

  it('should return 400 for invalid selection payload', async () => {
    const session = createTestSession();
    await saveWorkspace({ session, items: {} });

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: 'not-an-array' }),
    });
    
    const response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent session', async () => {
    const nonExistentId = generateSessionId();
    
    const request = new Request(`http://localhost:3100/api/sessions/${nonExistentId}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [] }),
    });
    
    const response = await PATCH(request, { params: Promise.resolve({ sessionId: nonExistentId }) });
    expect(response.status).toBe(404);
  });

  it('should accept empty array to clear selection', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id],
        selectedIds: [item1.id],
      },
      items: {
        [item1.id]: item1,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [] }),
    });
    
    const response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.session.selectedIds).toEqual([]);
  });

  it('should persist selection across multiple updates', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    const item3 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id, item3.id],
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
        [item3.id]: item3,
      },
    };
    
    await saveWorkspace(workspace);

    // First update: select item1
    let request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [item1.id] }),
    });
    let response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    let data = await response.json();
    expect(data.session.selectedIds).toEqual([item1.id]);

    // Second update: select item1 and item2
    request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [item1.id, item2.id] }),
    });
    response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    data = await response.json();
    expect(data.session.selectedIds).toEqual([item1.id, item2.id]);

    // Third update: select only item3
    request = new Request(`http://localhost:3100/api/sessions/${session.id}/selection`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: [item3.id] }),
    });
    response = await PATCH(request, { params: Promise.resolve({ sessionId: session.id }) });
    data = await response.json();
    expect(data.session.selectedIds).toEqual([item3.id]);
  });
});
