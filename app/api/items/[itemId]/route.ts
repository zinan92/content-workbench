/**
 * Item detail API route - loads ready items for studio access
 */

import { NextResponse } from 'next/server';
import { findItemById } from '@/lib/services/workspace-store';

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

    // Only ready items can access studio
    if (item.prepStatus !== 'ready') {
      return NextResponse.json(
        { error: 'Item is not ready for studio access' },
        { status: 403 }
      );
    }

    // Return item data for studio
    return NextResponse.json({ item });

  } catch (error) {
    console.error('Item load error:', error);
    return NextResponse.json(
      { error: 'Failed to load item' },
      { status: 500 }
    );
  }
}
