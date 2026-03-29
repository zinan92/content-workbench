/**
 * Draft Repository
 * 
 * Provides owner-scoped platform draft persistence with feature-flagged migration
 * from filesystem to hosted Supabase storage.
 * 
 * OWNERSHIP RULES:
 * - All draft operations verify item/session ownership first
 * - Only ready items can have drafts edited
 * - Cross-account access is blocked at the repository layer
 */

import type { ContentItem, ContentItemId, SessionId, PlatformDraft } from '@/lib/domain/types';
import { useHostedPersistence } from '@/lib/config/env';
import { loadOwnedItem, findOwnedItemById, saveItem } from './item-repository';

/**
 * Update a platform draft for an owned ready item
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session that owns this item
 * @param itemId - The item to update
 * @param draft - The platform draft to save
 * @throws Error if item not found, not owned, or not ready
 */
export async function updatePlatformDraft(
  userId: string,
  sessionId: SessionId,
  itemId: ContentItemId,
  draft: PlatformDraft
): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with ownership check in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify ownership and readiness before updating
    const item = await loadOwnedItem(userId, sessionId, itemId);
    
    if (!item) {
      throw new Error(`Item not found or unauthorized: ${itemId}`);
    }
    
    if (item.prepStatus !== 'ready') {
      throw new Error(`Item not ready for studio access: ${itemId}`);
    }
    
    // Update the draft with current timestamp
    draft.lastUpdated = new Date().toISOString();
    item.platformDrafts[draft.platform] = draft;
    item.updatedAt = new Date().toISOString();
    
    await saveItem(item, userId);
  }
}

/**
 * Load an item with its drafts, searching across all sessions for the user
 * 
 * This is used for studio access where we only have the item ID.
 * 
 * @param userId - The requesting user's ID
 * @param itemId - The item ID to load
 * @returns The item with drafts if found and owned by user, null otherwise
 */
export async function loadOwnedItemWithDrafts(
  userId: string,
  itemId: ContentItemId
): Promise<ContentItem | null> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: use item repository's cross-session search
    return await findOwnedItemById(userId, itemId);
  }
}

/**
 * Find other ready items in the same session for next-video navigation
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session to search in
 * @param currentItemId - The current item ID to exclude
 * @returns Array of other ready items owned by user
 */
export async function findOtherReadyItems(
  userId: string,
  sessionId: SessionId,
  currentItemId: ContentItemId
): Promise<Array<{ id: string; title: string }>> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: load all owned items and filter
    const { loadOwnedItems } = await import('./item-repository');
    const allItems = await loadOwnedItems(userId, sessionId);
    
    return allItems
      .filter(item => item.id !== currentItemId && item.prepStatus === 'ready')
      .map(item => ({
        id: item.id,
        title: item.source.title,
      }));
  }
}
