/**
 * Discovery Service - orchestrates creator profile discovery and session hydration
 */

import type { SessionId, ContentItem } from '../domain/types';
import { generateContentItemId } from '../domain/ids';
import { calculateSimpleScore, isRecommended } from '../domain/scoring';
import { getDiscoveryAdapter } from '../adapters/discovery-adapter';
import { loadSession, saveSession, saveItem } from './workspace-store';

/**
 * Discovery result including hydrated items and partial flag
 */
export interface DiscoveryServiceResult {
  items: ContentItem[];
  isPartial: boolean;
}

/**
 * Discover and hydrate a creator-profile session with candidate items
 * 
 * This runs discovery via the adapter, creates ContentItem records with
 * scores and recommendations, saves them to the workspace, and updates
 * the session's candidateIds.
 */
export async function discoverAndHydrateSession(
  sessionId: SessionId
): Promise<DiscoveryServiceResult> {
  // Load the session
  const session = await loadSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Verify this is a creator-profile session
  if (session.inputType !== 'creator-profile') {
    throw new Error(`Discovery is only supported for creator-profile sessions. Session ${sessionId} is ${session.inputType}.`);
  }

  // Run discovery via adapter
  const adapter = getDiscoveryAdapter();
  const discoveryResult = await adapter.discoverFromCreatorProfile(session.inputLink);

  // Create ContentItem records for each candidate
  const now = new Date().toISOString();
  const items: ContentItem[] = [];

  for (const candidate of discoveryResult.candidates) {
    const itemId = generateContentItemId();
    const simpleScore = calculateSimpleScore(candidate);
    const recommended = isRecommended(candidate);

    const item: ContentItem = {
      id: itemId,
      sessionId,
      source: candidate,
      simpleScore,
      recommended,
      prepStatus: 'pending',
      platformDrafts: {
        xiaohongshu: createEmptyPlatformDraft('xiaohongshu', now),
        bilibili: createEmptyPlatformDraft('bilibili', now),
        'video-channel': createEmptyPlatformDraft('video-channel', now),
        'wechat-oa': createEmptyPlatformDraft('wechat-oa', now),
        x: createEmptyPlatformDraft('x', now),
      },
      createdAt: now,
      updatedAt: now,
    };

    items.push(item);
    await saveItem(item);
  }

  // Update session with candidateIds and partial flag
  session.candidateIds = items.map(item => item.id);
  session.isPartialDiscovery = discoveryResult.isPartial;
  session.updatedAt = now;
  await saveSession(session);

  return {
    items,
    isPartial: discoveryResult.isPartial,
  };
}

/**
 * Hydrate a single-video session with one preparation item
 * 
 * This resolves the video metadata via the adapter, creates a single ContentItem,
 * saves it to the workspace, and updates the session's candidateIds and selectedIds.
 */
export async function hydrateSingleVideoSession(
  sessionId: SessionId
): Promise<ContentItem> {
  // Load the session
  const session = await loadSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Verify this is a single-video session
  if (session.inputType !== 'single-video') {
    throw new Error(`Single-video hydration is only supported for single-video sessions. Session ${sessionId} is ${session.inputType}.`);
  }

  // Resolve single video via adapter
  const adapter = getDiscoveryAdapter();
  const videoMetadata = await adapter.resolveSingleVideo(session.inputLink);

  // Create ContentItem for the video
  const now = new Date().toISOString();
  const itemId = generateContentItemId();
  const simpleScore = calculateSimpleScore(videoMetadata);
  const recommended = isRecommended(videoMetadata);

  const item: ContentItem = {
    id: itemId,
    sessionId,
    source: videoMetadata,
    simpleScore,
    recommended,
    prepStatus: 'pending',
    platformDrafts: {
      xiaohongshu: createEmptyPlatformDraft('xiaohongshu', now),
      bilibili: createEmptyPlatformDraft('bilibili', now),
      'video-channel': createEmptyPlatformDraft('video-channel', now),
      'wechat-oa': createEmptyPlatformDraft('wechat-oa', now),
      x: createEmptyPlatformDraft('x', now),
    },
    createdAt: now,
    updatedAt: now,
  };

  // Save the item
  await saveItem(item);

  // Update session with the item ID in both candidateIds and selectedIds
  session.candidateIds = [itemId];
  session.selectedIds = [itemId];
  session.updatedAt = now;
  await saveSession(session);

  return item;
}

/**
 * Create an empty platform draft
 */
function createEmptyPlatformDraft(
  platform: ContentItem['platformDrafts'][keyof ContentItem['platformDrafts']]['platform'],
  timestamp: string
): ContentItem['platformDrafts'][keyof ContentItem['platformDrafts']] {
  return {
    platform,
    title: '',
    body: '',
    coverNotes: '',
    checklist: {},
    lastUpdated: timestamp,
  };
}
