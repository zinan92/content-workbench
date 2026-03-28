/**
 * Manual fixture for workspace file inspection
 * Run: npx tsx tests/manual-fixture.ts
 */

import { saveWorkspace } from '../lib/services/workspace-store';
import { generateSessionId, generateContentItemId } from '../lib/domain/ids';
import type { Session, ContentItem, Workspace } from '../lib/domain/types';

async function createManualFixture() {
  const now = new Date().toISOString();
  const sessionId = generateSessionId();
  
  const session: Session = {
    id: sessionId,
    inputLink: 'https://www.douyin.com/user/example',
    inputType: 'creator-profile',
    candidateIds: [],
    selectedIds: [],
    workflowPhase: 'discovery',
    createdAt: now,
    updatedAt: now,
  };
  
  const item1Id = generateContentItemId();
  const item2Id = generateContentItemId();
  
  const item1: ContentItem = {
    id: item1Id,
    sessionId: sessionId,
    source: {
      title: 'Example Video 1',
      publishDate: '2026-03-20T10:00:00Z',
      duration: 120,
      likes: 5000,
      comments: 250,
      shares: 100,
      sourceUrl: 'https://www.douyin.com/video/example1',
      authorName: 'Test Creator',
      authorId: 'creator123',
    },
    simpleScore: 75,
    recommended: true,
    prepStatus: 'ready',
    artifacts: {
      videoPath: '/path/to/video1.mp4',
      transcriptPath: '/path/to/transcript1.txt',
      archivePath: '/path/to/archive1.json',
    },
    platformDrafts: {
      xiaohongshu: {
        platform: 'xiaohongshu',
        title: 'XHS Title - Example Video 1',
        body: 'This is an example XHS body content.',
        checklist: { 'cover-uploaded': true, 'hashtags-added': false },
        lastUpdated: now,
      },
      bilibili: {
        platform: 'bilibili',
        title: 'Bilibili Title - Example Video 1',
        body: 'This is an example Bilibili description.',
        checklist: { 'cover-uploaded': false },
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
  };
  
  const item2: ContentItem = {
    id: item2Id,
    sessionId: sessionId,
    source: {
      title: 'Example Video 2',
      publishDate: '2026-03-21T14:30:00Z',
      duration: 90,
      likes: 3500,
      comments: 180,
      shares: 75,
      sourceUrl: 'https://www.douyin.com/video/example2',
      authorName: 'Test Creator',
      authorId: 'creator123',
    },
    simpleScore: 60,
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
  };
  
  session.candidateIds = [item1Id, item2Id];
  session.selectedIds = [item1Id];
  
  const workspace: Workspace = {
    session,
    items: {
      [item1Id]: item1,
      [item2Id]: item2,
    },
  };
  
  await saveWorkspace(workspace);
  
  console.log('Manual fixture created successfully!');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Workspace files saved to: data/workspaces/${sessionId}/`);
  console.log('\nYou can inspect the files:');
  console.log(`- data/workspaces/${sessionId}/workspace.json (session metadata)`);
  console.log(`- data/workspaces/${sessionId}/items/${item1Id}.json (item 1 - ready)`);
  console.log(`- data/workspaces/${sessionId}/items/${item2Id}.json (item 2 - pending)`);
}

createManualFixture().catch(console.error);
