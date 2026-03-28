/**
 * Retry Item Preparation API
 * POST /api/sessions/[sessionId]/prepare/[itemId]/retry
 * 
 * Retries preparation for a single failed (or ready) item without affecting others
 */

import { NextResponse } from 'next/server';
import { retryItemPreparation } from '@/lib/services/prepare-service';
import { loadItem } from '@/lib/services/workspace-store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; itemId: string }> }
) {
  try {
    const { sessionId, itemId } = await params;

    // Check item exists
    const item = await loadItem(sessionId, itemId);
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Retry preparation
    await retryItemPreparation(sessionId, itemId);

    // Return updated item state
    const updatedItem = await loadItem(sessionId, itemId);
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
