/**
 * Tests for Prepare Selected API
 * 
 * Coverage:
 * - POST /api/sessions/[sessionId]/prepare
 * - Scopes preparation to currently selected items only
 * - Returns preparation initiation status
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST } from '../../app/api/sessions/[sessionId]/prepare/route';
import { saveWorkspace, loadSession, loadItems } from '../../lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '../../lib/domain/ids';
import type { Session, ContentItem, Workspace } from '../../lib/domain/types';

let testDataDir: string;
const testSessionIds: string[] = [];

beforeEach(async () => {
  testDataDir = await mkdtemp(join(tmpdir(), 'prepare-test-'));
  process.env.DATA_ROOT = testDataDir;
});

afterEach(async () => {
  if (testDataDir) {
    await rm(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_ROOT;
  testSessionIds.length = 0;
});

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
    workflowPhase: 'selection',
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
    platformDrafts: {} as ContentItem['platformDrafts'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('POST /api/sessions/[sessionId]/prepare', () => {
  it('should prepare only selected items', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    const item2 = createTestItem(session.id);
    const item3 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id, item3.id],
        selectedIds: [item1.id, item3.id], // Only select item1 and item3
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
        [item3.id]: item3,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const response = await POST(request, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.preparedIds).toEqual([item1.id, item3.id]);
    expect(data.preparedIds).not.toContain(item2.id);
  });

  it('should return 400 when no items are selected', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id);
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id],
        selectedIds: [], // No selection
      },
      items: {
        [item1.id]: item1,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
    });
    
    const response = await POST(request, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toMatch(/no items selected/i);
  });

  it('should return 404 for non-existent session', async () => {
    const nonExistentId = generateSessionId();
    
    const request = new Request(`http://localhost:3100/api/sessions/${nonExistentId}/prepare`, {
      method: 'POST',
    });
    
    const response = await POST(request, { params: Promise.resolve({ sessionId: nonExistentId }) });
    expect(response.status).toBe(404);
  });

  it('should update session workflow phase to preparation', async () => {
    const session = createTestSession({ workflowPhase: 'selection' });
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

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
    });
    
    await POST(request, { params: Promise.resolve({ sessionId: session.id }) });

    const updatedSession = await loadSession(session.id);
    expect(updatedSession?.workflowPhase).toBe('preparation');
  });

  it('should not prepare unselected items even if they exist in candidateIds', async () => {
    const session = createTestSession();
    const item1 = createTestItem(session.id, { source: { title: 'Selected', sourceUrl: 'url' } });
    const item2 = createTestItem(session.id, { source: { title: 'Unselected', sourceUrl: 'url' } });
    
    const workspace: Workspace = {
      session: {
        ...session,
        candidateIds: [item1.id, item2.id],
        selectedIds: [item1.id], // Only item1 selected
      },
      items: {
        [item1.id]: item1,
        [item2.id]: item2,
      },
    };
    
    await saveWorkspace(workspace);

    const request = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
    });
    
    const response = await POST(request, { params: Promise.resolve({ sessionId: session.id }) });

    const data = await response.json();
    expect(data.preparedIds).toEqual([item1.id]);
    
    // Verify item2 remains in pending state
    const items = await loadItems(session.id);
    const item2Status = items.find(i => i.id === item2.id)?.prepStatus;
    expect(item2Status).toBe('pending');
  });

  it('should handle prepare request idempotently', async () => {
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

    // First prepare
    const request1 = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
    });
    const response1 = await POST(request1, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response1.status).toBe(200);

    // Second prepare (idempotent)
    const request2 = new Request(`http://localhost:3100/api/sessions/${session.id}/prepare`, {
      method: 'POST',
    });
    const response2 = await POST(request2, { params: Promise.resolve({ sessionId: session.id }) });
    expect(response2.status).toBe(200);
    
    const data2 = await response2.json();
    expect(data2.preparedIds).toEqual([item1.id]);
  });
});
