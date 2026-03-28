/**
 * Workspace Store - repo-local JSON persistence
 */

import type { Session, ContentItem, Workspace, SessionId, ContentItemId } from '../domain/types';
import { getWorkspaceFile, getItemFile, getItemsDir } from '../utils/paths';
import { readJsonFile, writeJsonFile, fileExists, listFiles } from '../utils/fs';

/**
 * Save a complete workspace (session + items)
 */
export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const { session, items } = workspace;
  
  // Save session file
  await writeJsonFile(getWorkspaceFile(session.id), session);
  
  // Save each item file
  for (const item of Object.values(items)) {
    await writeJsonFile(getItemFile(session.id, item.id), item);
  }
}

/**
 * Load a complete workspace by session ID
 */
export async function loadWorkspace(sessionId: SessionId): Promise<Workspace | null> {
  const workspaceFile = getWorkspaceFile(sessionId);
  
  // Check if workspace exists
  if (!(await fileExists(workspaceFile))) {
    return null;
  }
  
  // Load session
  const session = await readJsonFile<Session>(workspaceFile);
  
  // Load all items
  const itemsDir = getItemsDir(sessionId);
  const itemFiles = await listFiles(itemsDir, /\.json$/);
  const items: Record<ContentItemId, ContentItem> = {};
  
  for (const fileName of itemFiles) {
    const itemFile = getItemFile(sessionId, fileName.replace('.json', ''));
    const item = await readJsonFile<ContentItem>(itemFile);
    items[item.id] = item;
  }
  
  return { session, items };
}

/**
 * Save or update session metadata
 */
export async function saveSession(session: Session): Promise<void> {
  await writeJsonFile(getWorkspaceFile(session.id), session);
}

/**
 * Load session metadata only
 */
export async function loadSession(sessionId: SessionId): Promise<Session | null> {
  const workspaceFile = getWorkspaceFile(sessionId);
  
  if (!(await fileExists(workspaceFile))) {
    return null;
  }
  
  return await readJsonFile<Session>(workspaceFile);
}

/**
 * Save or update a single content item
 */
export async function saveItem(item: ContentItem): Promise<void> {
  await writeJsonFile(getItemFile(item.sessionId, item.id), item);
}

/**
 * Load a single content item
 */
export async function loadItem(sessionId: SessionId, itemId: ContentItemId): Promise<ContentItem | null> {
  const itemFile = getItemFile(sessionId, itemId);
  
  if (!(await fileExists(itemFile))) {
    return null;
  }
  
  return await readJsonFile<ContentItem>(itemFile);
}

/**
 * Load all items for a session
 */
export async function loadItems(sessionId: SessionId): Promise<ContentItem[]> {
  const itemsDir = getItemsDir(sessionId);
  const itemFiles = await listFiles(itemsDir, /\.json$/);
  const items: ContentItem[] = [];
  
  for (const fileName of itemFiles) {
    const itemId = fileName.replace('.json', '');
    const item = await loadItem(sessionId, itemId);
    if (item) {
      items.push(item);
    }
  }
  
  return items;
}

/**
 * Update session selected IDs
 */
export async function updateSessionSelection(sessionId: SessionId, selectedIds: ContentItemId[]): Promise<void> {
  const session = await loadSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  session.selectedIds = selectedIds;
  session.updatedAt = new Date().toISOString();
  await saveSession(session);
}

/**
 * Update item preparation status
 */
export async function updateItemPrepStatus(
  sessionId: SessionId,
  itemId: ContentItemId,
  prepStatus: ContentItem['prepStatus'],
  prepFailureReason?: string
): Promise<void> {
  const item = await loadItem(sessionId, itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }
  
  item.prepStatus = prepStatus;
  item.prepFailureReason = prepFailureReason;
  item.updatedAt = new Date().toISOString();
  await saveItem(item);
}

/**
 * Update platform draft for an item
 */
export async function updatePlatformDraft(
  sessionId: SessionId,
  itemId: ContentItemId,
  draft: ContentItem['platformDrafts'][keyof ContentItem['platformDrafts']]
): Promise<void> {
  const item = await loadItem(sessionId, itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }
  
  draft.lastUpdated = new Date().toISOString();
  item.platformDrafts[draft.platform] = draft;
  item.updatedAt = new Date().toISOString();
  await saveItem(item);
}

/**
 * Check if a session exists
 */
export async function sessionExists(sessionId: SessionId): Promise<boolean> {
  return await fileExists(getWorkspaceFile(sessionId));
}
