/**
 * Prepare Selected API
 * POST /api/sessions/[sessionId]/prepare
 * 
 * Initiates preparation for currently selected items only
 */

import { NextResponse } from 'next/server';
import { loadSession, saveSession } from '@/lib/services/workspace-store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Load session
    const session = await loadSession(sessionId);
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

    // Update session workflow phase to preparation
    session.workflowPhase = 'preparation';
    session.updatedAt = new Date().toISOString();
    await saveSession(session);

    // Return prepared item IDs (scoped to selection only)
    return NextResponse.json({
      preparedIds: session.selectedIds,
      session,
    });

  } catch (error) {
    console.error('Prepare error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate preparation' },
      { status: 500 }
    );
  }
}
