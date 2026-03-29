/**
 * Retry Item Preparation API
 * POST /api/sessions/[sessionId]/prepare/[itemId]/retry
 * 
 * Retries preparation for a single failed (or ready) item without affecting others
 */

import { NextResponse } from 'next/server';
import { retryItemPreparation } from '@/lib/services/prepare-service';
import { loadOwnedItem } from '@/lib/repositories';
import { requireUserId } from '@/lib/auth/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; itemId: string }> }
) {
  try {
    // VAL-AUTH-011: Require authentication and enforce ownership
    const userId = await requireUserId();
    const { sessionId, itemId } = await params;

    // Check item exists and is owned
    const item = await loadOwnedItem(userId, sessionId, itemId);
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // VAL-AUTH-011: Retry preparation (ownership enforced)
    await retryItemPreparation(sessionId, itemId, userId);

    // Return updated item state
    const updatedItem = await loadOwnedItem(userId, sessionId, itemId);
    return NextResponse.json({
      itemId: updatedItem!.id,
      prepStatus: updatedItem!.prepStatus,
      prepFailureReason: updatedItem!.prepFailureReason,
      artifacts: updatedItem!.artifacts,
    });

  } catch (error) {
    console.error('Retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry preparation' },
      { status: 500 }
    );
  }
}
