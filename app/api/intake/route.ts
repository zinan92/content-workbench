/**
 * Intake API route - accepts Douyin links and creates sessions
 */

import { NextResponse } from 'next/server';
import { classifyDouyinLink } from '@/lib/domain/links';
import { generateSessionId } from '@/lib/domain/ids';
import type { Session } from '@/lib/domain/types';
import { saveSession } from '@/lib/repositories';
import { requireUserId } from '@/lib/auth/server';
import { getDiscoveryAdapter, DiscoveryResolutionError } from '@/lib/adapters/discovery-adapter';

export async function POST(request: Request) {
  try {
    // VAL-AUTH-004: Require authentication for intake
    const userId = await requireUserId();
    
    // Parse request body
    const body = await request.json();
    const { link } = body;

    // Validate link presence
    if (!link || typeof link !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Link is required',
        },
        { status: 400 }
      );
    }

    // Classify the link
    const inputType = classifyDouyinLink(link);

    // Handle unsupported links
    if (inputType === 'unsupported') {
      return NextResponse.json(
        {
          success: false,
          error: 'This link is not supported. Please provide a Douyin creator profile or single video link.',
          inputType: 'unsupported',
        },
        { status: 400 }
      );
    }

    // For supported Douyin links, attempt early resolution check to provide immediate feedback
    // This allows VAL-INTAKE-006: recoverable resolution failures stay on intake
    try {
      const adapter = getDiscoveryAdapter();
      
      if (inputType === 'creator-profile') {
        // Quick validation check - actual discovery happens on session load
        // This just verifies the link can be resolved
        await adapter.discoverFromCreatorProfile(link);
      } else if (inputType === 'single-video') {
        // For single-video, simulate resolution check
        // In a real implementation, this would validate the video exists
        // For now, we use the same adapter pattern for consistency
        // The adapter will throw DiscoveryResolutionError if it can't resolve
        await adapter.discoverFromCreatorProfile(link);
      }
    } catch (error) {
      if (error instanceof DiscoveryResolutionError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            errorType: 'resolution-failure',
            inputType,
            preservedLink: link,
          },
          { status: 422 }
        );
      }
      // Re-throw unexpected errors
      throw error;
    }

    // Create new session
    const sessionId = generateSessionId();
    const now = new Date().toISOString();
    
    const session: Session = {
      id: sessionId,
      inputLink: link,
      inputType,
      candidateIds: [],
      selectedIds: [],
      workflowPhase: inputType === 'creator-profile' ? 'discovery' : 'preparation',
      createdAt: now,
      updatedAt: now,
    };

    // VAL-AUTH-004: Save session with owner association
    await saveSession(session, userId);

    // Determine next route based on input type
    const nextRoute = `/sessions/${sessionId}`;

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId,
      inputType,
      nextRoute,
    });

  } catch (error) {
    console.error('Intake error:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred processing your request',
      },
      { status: 500 }
    );
  }
}
