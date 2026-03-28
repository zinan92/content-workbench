/**
 * Item detail API route - loads ready items for studio access
 */

import { NextResponse } from 'next/server';
import { findItemById, loadSession, loadItems } from '@/lib/services/workspace-store';

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

    // Load other ready items from the same session for next-video navigation
    const session = await loadSession(item.sessionId);
    const otherReadyItems: Array<{ id: string; title: string }> = [];

    if (session) {
      const allItems = await loadItems(item.sessionId);
      for (const sessionItem of allItems) {
        if (sessionItem.id !== itemId && sessionItem.prepStatus === 'ready') {
          otherReadyItems.push({
            id: sessionItem.id,
            title: sessionItem.source.title,
          });
        }
      }
    }

    // Return item data for studio plus other ready items
    return NextResponse.json({ item, otherReadyItems });

  } catch (error) {
    console.error('Item load error:', error);
    return NextResponse.json(
      { error: 'Failed to load item' },
      { status: 500 }
    );
  }
}
