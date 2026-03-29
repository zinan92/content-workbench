/**
 * Item detail API route - loads ready items for studio access
 */

import { NextResponse } from 'next/server';
import { loadOwnedItemWithDrafts, findOtherReadyItems } from '@/lib/repositories';
import { requireUserId } from '@/lib/auth/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    // VAL-AUTH-006: Require authentication and enforce ownership
    const userId = await requireUserId();
    const { itemId } = await params;

    // VAL-AUTH-006: Load item only if owned by current user
    const item = await loadOwnedItemWithDrafts(userId, itemId);

    // VAL-AUTH-008: Return blocked state without leaking details
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

    // VAL-AUTH-007: Load other ready items from owned session only
    const otherReadyItems = await findOtherReadyItems(userId, item.sessionId, itemId);

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
