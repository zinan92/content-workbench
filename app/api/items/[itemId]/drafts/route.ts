/**
 * Item drafts API route - persist per-platform draft and checklist state
 */

import { NextResponse } from 'next/server';
import { findItemById } from '@/lib/services/workspace-store';
import { updatePlatformDraft } from '@/lib/services/workspace-store';
import type { Platform, PlatformDraft } from '@/lib/domain/types';

const VALID_PLATFORMS: Platform[] = ['xiaohongshu', 'bilibili', 'video-channel', 'wechat-oa', 'x'];

/**
 * GET /api/items/[itemId]/drafts
 * Load all platform drafts for an item
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // Load item across all sessions
    const item = await findItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Return all platform drafts
    return NextResponse.json({ drafts: item.platformDrafts });

  } catch (error) {
    console.error('Draft load error:', error);
    return NextResponse.json(
      { error: 'Failed to load drafts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items/[itemId]/drafts
 * Save platform-specific draft and checklist state
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // Load item across all sessions
    const item = await findItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { platform, title, body: draftBody, coverNotes, checklist } = body;

    // Validate platform
    if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
      return NextResponse.json(
        { error: 'Invalid or missing platform' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (title === undefined || draftBody === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body are required' },
        { status: 400 }
      );
    }

    // Construct platform draft
    const draft: PlatformDraft = {
      platform: platform as Platform,
      title,
      body: draftBody,
      coverNotes: coverNotes || '',
      checklist: checklist || {},
      lastUpdated: new Date().toISOString(),
    };

    // Save to workspace store
    await updatePlatformDraft(item.sessionId, itemId, draft);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Draft save error:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}
