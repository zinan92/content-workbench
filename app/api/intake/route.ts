/**
 * Intake API route - accepts Douyin links and creates sessions
 */

import { NextResponse } from 'next/server';
import { classifyDouyinLink } from '@/lib/domain/links';
import { generateSessionId } from '@/lib/domain/ids';
import type { Session } from '@/lib/domain/types';
import { saveSession } from '@/lib/services/workspace-store';

export async function POST(request: Request) {
  try {
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

    // Save session
    await saveSession(session);

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
