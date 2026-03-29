/**
 * Session selection persistence API
 * PATCH /api/sessions/[sessionId]/selection
 */

import { NextResponse } from 'next/server';
import { updateSessionSelection, loadOwnedSession } from '@/lib/repositories';
import { requireUserId } from '@/lib/auth/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // VAL-AUTH-011: Require authentication and enforce ownership
    const userId = await requireUserId();
    const { sessionId } = await params;
    const body = await request.json();

    // Validate payload
    if (!Array.isArray(body.selectedIds)) {
      return NextResponse.json(
        { error: 'selectedIds must be an array' },
        { status: 400 }
      );
    }

    // Check if session exists and is owned by user
    const session = await loadOwnedSession(userId, sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // VAL-AUTH-011: Update selection (ownership enforced)
    await updateSessionSelection(userId, sessionId, body.selectedIds);

    // Return updated session
    const updatedSession = await loadOwnedSession(userId, sessionId);
    return NextResponse.json({ session: updatedSession });

  } catch (error) {
    console.error('Selection update error:', error);
    return NextResponse.json(
      { error: 'Failed to update selection' },
      { status: 500 }
    );
  }
}
