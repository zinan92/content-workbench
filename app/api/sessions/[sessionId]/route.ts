/**
 * Session API route - loads session data
 */

import { NextResponse } from 'next/server';
import { loadSession } from '@/lib/services/workspace-store';

export async function GET(
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

    return NextResponse.json(session);

  } catch (error) {
    console.error('Session load error:', error);
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  }
}
