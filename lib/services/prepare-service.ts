/**
 * Preparation Service
 * 
 * Orchestrates preparation lifecycle for content items:
 * pending → downloading → transcribing → ready/failed
 * 
 * Ensures:
 * - Item-isolated failures (one failure doesn't block others)
 * - Persisted artifact paths on success
 * - Refresh-stable state
 */

import type { SessionId, ContentItemId, PrepStatus } from '../domain/types';
import { loadItem, saveItem, loadItems } from './workspace-store';
import { getPreparationAdapter } from '../adapters/preparation-adapter';

/**
 * Prepare multiple items in parallel with isolated failure handling
 */
export async function prepareItems(
  sessionId: SessionId,
  itemIds: ContentItemId[]
): Promise<void> {
  if (itemIds.length === 0) {
    return;
  }

  const adapter = getPreparationAdapter();

  // Prepare all items in parallel, isolated from each other
  await Promise.allSettled(
    itemIds.map(itemId => prepareSingleItem(sessionId, itemId, adapter))
  );
}

/**
 * Prepare a single item through its lifecycle
 */
async function prepareSingleItem(
  sessionId: SessionId,
  itemId: ContentItemId,
  adapter: ReturnType<typeof getPreparationAdapter>
): Promise<void> {
  const item = await loadItem(sessionId, itemId);
  if (!item) {
    console.warn(`Item not found: ${itemId}`);
    return;
  }

  try {
    // Start preparation
    await updateItemStatus(sessionId, itemId, 'pending');

    // Run preparation with progress callbacks
    const result = await adapter.prepareVideo(
      itemId,
      item.source.sourceUrl,
      async (id, status) => {
        // Update status during progress
        await updateItemStatus(sessionId, id, status);
      }
    );

    // Handle result
    if (result.status === 'ready') {
      const updatedItem = await loadItem(sessionId, itemId);
      if (updatedItem) {
        updatedItem.prepStatus = 'ready';
        updatedItem.artifacts = result.artifacts;
        updatedItem.prepFailureReason = undefined;
        updatedItem.updatedAt = new Date().toISOString();
        await saveItem(updatedItem);
      }
    } else {
      await updateItemStatus(sessionId, itemId, 'failed', result.failureReason);
    }
  } catch (error) {
    // Catch any unexpected errors and mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateItemStatus(sessionId, itemId, 'failed', `Preparation failed: ${errorMessage}`);
  }
}

/**
 * Update item preparation status
 */
async function updateItemStatus(
  sessionId: SessionId,
  itemId: ContentItemId,
  status: PrepStatus,
  failureReason?: string
): Promise<void> {
  const item = await loadItem(sessionId, itemId);
  if (!item) {
    return;
  }

  item.prepStatus = status;
  if (failureReason) {
    item.prepFailureReason = failureReason;
  } else if (status !== 'failed') {
    // Clear failure reason on successful transitions
    item.prepFailureReason = undefined;
  }
  item.updatedAt = new Date().toISOString();
  await saveItem(item);
}

/**
 * Retry preparation for a failed item
 */
export async function retryItemPreparation(
  sessionId: SessionId,
  itemId: ContentItemId
): Promise<void> {
  const item = await loadItem(sessionId, itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  // Reset to pending and retry
  const adapter = getPreparationAdapter();
  await prepareSingleItem(sessionId, itemId, adapter);
}

/**
 * Get preparation status for all items in a session
 */
export async function getPreparationStatus(sessionId: SessionId) {
  const items = await loadItems(sessionId);
  
  return items.map(item => ({
    id: item.id,
    title: item.source.title,
    prepStatus: item.prepStatus,
    prepFailureReason: item.prepFailureReason,
    artifacts: item.artifacts,
  }));
}
