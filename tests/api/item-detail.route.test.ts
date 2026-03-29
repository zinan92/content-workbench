/**
 * Tests for GET /api/items/[itemId] - Item detail route
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GET } from '@/app/api/items/[itemId]/route';
import { generateSessionId, generateContentItemId } from '@/lib/domain/ids';
import { saveSession, saveItem } from '@/lib/services/workspace-store';
import type { Session, ContentItem } from '@/lib/domain/types';
import { setupAuthMock } from '../utils/auth-mock';

// Mock data directory for tests
let testDataDir: string;
let authCleanup: () => void;

describe('GET /api/items/[itemId]', () => {
  let testSessionId: string;
  let readyItemId: string;
  let pendingItemId: string;

  beforeEach(async () => {
    testDataDir = await mkdtemp(join(tmpdir(), 'item-detail-test-'));
    process.env.DATA_ROOT = testDataDir;
    authCleanup = setupAuthMock();
    
    testSessionId = generateSessionId();
    readyItemId = generateContentItemId();
    pendingItemId = generateContentItemId();

    // Create session
    const session: Session = {
      id: testSessionId,
      inputLink: 'https://www.douyin.com/user/test',
      inputType: 'creator-profile',
      candidateIds: [readyItemId, pendingItemId],
      selectedIds: [readyItemId, pendingItemId],
      workflowPhase: 'preparation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create ready item
    const readyItem: ContentItem = {
      id: readyItemId,
      sessionId: testSessionId,
      source: {
        title: 'Ready Video',
        sourceUrl: 'https://www.douyin.com/video/ready123',
      },
      simpleScore: 85,
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

    // Create pending item
    const pendingItem: ContentItem = {
      id: pendingItemId,
      sessionId: testSessionId,
      source: {
        title: 'Pending Video',
        sourceUrl: 'https://www.douyin.com/video/pending123',
      },
      simpleScore: 75,
      recommended: false,
      prepStatus: 'pending',
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

    await saveSession(session);
    await saveItem(readyItem);
    await saveItem(pendingItem);
  });

  afterEach(async () => {
    if (testDataDir) {
      await rm(testDataDir, { recursive: true, force: true });
    }
    delete process.env.DATA_ROOT;
    authCleanup();
  });

  it('returns 200 with item data for ready items', async () => {
    const request = new Request(`http://localhost/api/items/${readyItemId}`);
    const paramsPromise = Promise.resolve({ itemId: readyItemId });
    
    const response = await GET(request, { params: paramsPromise });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.item).toBeDefined();
    expect(data.item.id).toBe(readyItemId);
    expect(data.item.prepStatus).toBe('ready');
    expect(data.item.source.title).toBe('Ready Video');
    expect(data.item.artifacts).toBeDefined();
  });

  it('returns 403 for non-ready items', async () => {
    const request = new Request(`http://localhost/api/items/${pendingItemId}`);
    const paramsPromise = Promise.resolve({ itemId: pendingItemId });
    
    const response = await GET(request, { params: paramsPromise });
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toMatch(/not ready/i);
  });

  it('returns 404 for non-existent items', async () => {
    const nonExistentId = generateContentItemId();
    const request = new Request(`http://localhost/api/items/${nonExistentId}`);
    const paramsPromise = Promise.resolve({ itemId: nonExistentId });
    
    const response = await GET(request, { params: paramsPromise });
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns item with artifacts for ready items', async () => {
    const request = new Request(`http://localhost/api/items/${readyItemId}`);
    const paramsPromise = Promise.resolve({ itemId: readyItemId });
    
    const response = await GET(request, { params: paramsPromise });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.item.artifacts).toBeDefined();
    expect(data.item.artifacts.videoPath).toBe('/data/test/video.mp4');
    expect(data.item.artifacts.transcriptPath).toBe('/data/test/transcript.json');
  });

  it('includes platform drafts in response', async () => {
    const request = new Request(`http://localhost/api/items/${readyItemId}`);
    const paramsPromise = Promise.resolve({ itemId: readyItemId });
    
    const response = await GET(request, { params: paramsPromise });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.item.platformDrafts).toBeDefined();
  });
});
