/**
 * Session selection persistence API
 * PATCH /api/sessions/[sessionId]/selection
 */

import { NextResponse } from 'next/server';
import { updateSessionSelection, loadSession } from '@/lib/services/workspace-store';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // Validate payload
    if (!Array.isArray(body.selectedIds)) {
      return NextResponse.json(
        { error: 'selectedIds must be an array' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await loadSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update selection
    await updateSessionSelection(sessionId, body.selectedIds);

    // Return updated session
    const updatedSession = await loadSession(sessionId);
    return NextResponse.json({ session: updatedSession });

  } catch (error) {
    console.error('Selection update error:', error);
    return NextResponse.json(
      { error: 'Failed to update selection' },
      { status: 500 }
    );
  }
}
