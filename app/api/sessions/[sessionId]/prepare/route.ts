/**
 * Prepare Selected API
 * POST /api/sessions/[sessionId]/prepare
 * 
 * Initiates preparation for currently selected items only
 */

import { NextResponse } from 'next/server';
import { loadOwnedSession, updateSessionPhase } from '@/lib/repositories';
import { requireUserId } from '@/lib/auth/server';
import { prepareItems } from '@/lib/services/prepare-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // VAL-AUTH-011: Require authentication and enforce ownership
    const userId = await requireUserId();
    const { sessionId } = await params;

    // Load session (ownership enforced)
    const session = await loadOwnedSession(userId, sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate that items are selected
    if (session.selectedIds.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for preparation' },
        { status: 400 }
      );
    }

    // VAL-AUTH-011: Update session workflow phase to preparation (ownership enforced)
    await updateSessionPhase(userId, sessionId, 'preparation');

    // Start preparation for selected items (async, fire and forget)
    // The preparation runs in background and updates item statuses
    prepareItems(sessionId, session.selectedIds, userId).catch(error => {
      console.error('Preparation background error:', error);
    });

    // Reload session after phase update
    const updatedSession = await loadOwnedSession(userId, sessionId);

    // Return immediately with prepared item IDs (scoped to selection only)
    return NextResponse.json({
      preparedIds: session.selectedIds,
      session: updatedSession,
    });

  } catch (error) {
    console.error('Prepare error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate preparation' },
      { status: 500 }
    );
  }
}
