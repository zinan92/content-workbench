/**
 * Session API route - loads session data and discovered candidates
 */

import { NextResponse } from 'next/server';
import { loadSession, loadItems } from '@/lib/services/workspace-store';
import { discoverAndHydrateSession } from '@/lib/services/discovery-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Load session
    let session = await loadSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // For creator-profile sessions in discovery phase, run discovery if not yet done
    let items = await loadItems(sessionId);

    if (session.inputType === 'creator-profile' && items.length === 0) {
      try {
        const result = await discoverAndHydrateSession(sessionId);
        items = result.items;
        // Reload session to get updated candidateIds and isPartialDiscovery flag
        session = await loadSession(sessionId) || session;
      } catch (error) {
        console.error('Discovery error:', error);
        // Return session without candidates on discovery failure
        // This allows the UI to show a recoverable error state
      }
    }

    // Return session with discovered candidates for creator-profile sessions
    if (session.inputType === 'creator-profile') {
      return NextResponse.json({
        session,
        candidates: items,
        isPartial: session.isPartialDiscovery || false,
      });
    }

    // For single-video sessions, return session only (no candidate review)
    return NextResponse.json({ session });

  } catch (error) {
    console.error('Session load error:', error);
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  }
}
