/**
 * Item Repository
 * 
 * Provides owner-scoped content item persistence with feature-flagged migration
 * from filesystem to hosted Supabase storage.
 * 
 * OWNERSHIP RULES:
 * - All item operations verify session ownership first
 * - Cross-account access is blocked at the repository layer
 * - Non-owners receive null or empty results, never another user's data
 */

import type { ContentItem, ContentItemId, SessionId, PrepStatus } from '@/lib/domain/types';
import { useHostedPersistence } from '@/lib/config/env';
import { sessionExistsForUser } from './session-repository';
import { readJsonFile, writeJsonFile, fileExists } from '@/lib/utils/fs';
import { getItemFile, getItemsDir } from '@/lib/utils/paths';
import { promises as fs } from 'fs';

/**
 * Extended item type with owner information for persistence
 */
interface PersistedItem extends ContentItem {
  owner_id?: string;
}

/**
 * Save a content item with owner association
 * 
 * @param item - The item to save
 * @param userId - The owner's user ID
 */
export async function saveItem(item: ContentItem, userId: string): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: store owner_id alongside item data
    const persisted: PersistedItem = {
      ...item,
      owner_id: userId,
    };
    await writeJsonFile(getItemFile(item.sessionId, item.id), persisted);
  }
}

/**
 * Load a content item only if its session is owned by the specified user
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session ID that owns this item
 * @param itemId - The item ID to load
 * @returns The item if session is owned by user, null otherwise
 */
export async function loadOwnedItem(
  userId: string,
  sessionId: SessionId,
  itemId: ContentItemId
): Promise<ContentItem | null> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify session ownership first
    const sessionOwned = await sessionExistsForUser(userId, sessionId);
    if (!sessionOwned) {
      return null;
    }
    
    const itemFile = getItemFile(sessionId, itemId);
    
    if (!(await fileExists(itemFile))) {
      return null;
    }
    
    const persisted = await readJsonFile<PersistedItem>(itemFile);
    
    // Double-check owner_id if present (defense in depth)
    if (persisted.owner_id && persisted.owner_id !== userId) {
      return null;
    }
    
    // Remove owner_id before returning (not part of domain type)
    const { owner_id, ...item } = persisted;
    return item as ContentItem;
  }
}

/**
 * Load all items for a session, only if session is owned by the user
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session ID to load items from
 * @returns Array of items if session is owned by user, empty array otherwise
 */
export async function loadOwnedItems(
  userId: string,
  sessionId: SessionId
): Promise<ContentItem[]> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify session ownership first
    const sessionOwned = await sessionExistsForUser(userId, sessionId);
    if (!sessionOwned) {
      return [];
    }
    
    const itemsDir = getItemsDir(sessionId);
    
    if (!(await fileExists(itemsDir))) {
      return [];
    }
    
    const itemFiles = await fs.readdir(itemsDir);
    const jsonFiles = itemFiles.filter(f => f.endsWith('.json'));
    
    const items: ContentItem[] = [];
    
    for (const fileName of jsonFiles) {
      const itemId = fileName.replace('.json', '');
      const item = await loadOwnedItem(userId, sessionId, itemId);
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }
}

/**
 * Update item preparation status (owner-scoped mutation)
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session that owns this item
 * @param itemId - The item to update
 * @param prepStatus - The new prep status
 * @param prepFailureReason - Optional failure reason
 * @throws Error if item not found or session not owned by user
 */
export async function updateItemPrepStatus(
  userId: string,
  sessionId: SessionId,
  itemId: ContentItemId,
  prepStatus: PrepStatus,
  prepFailureReason?: string
): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with ownership check in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify ownership before updating
    const item = await loadOwnedItem(userId, sessionId, itemId);
    
    if (!item) {
      throw new Error(`Item not found or unauthorized: ${itemId}`);
    }
    
    item.prepStatus = prepStatus;
    item.prepFailureReason = prepFailureReason;
    item.updatedAt = new Date().toISOString();
    
    await saveItem(item, userId);
  }
}

/**
 * Find an item by ID across all sessions, only if owned by user
 * 
 * This is used for studio access where we only have the item ID.
 * 
 * @param userId - The requesting user's ID
 * @param itemId - The item ID to find
 * @returns The item if found and owned by user, null otherwise
 */
export async function findOwnedItemById(
  userId: string,
  itemId: ContentItemId
): Promise<ContentItem | null> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: scan all sessions for this user
    const { getWorkspacesDir } = await import('@/lib/utils/paths');
    const workspacesDir = getWorkspacesDir();
    
    if (!(await fileExists(workspacesDir))) {
      return null;
    }
    
    const entries = await fs.readdir(workspacesDir, { withFileTypes: true });
    const sessionIds = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    // Try to load the item from each session (ownership check built-in)
    for (const sessionId of sessionIds) {
      const item = await loadOwnedItem(userId, sessionId, itemId);
      if (item) {
        return item;
      }
    }
    
    return null;
  }
}
