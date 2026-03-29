/**
 * Sign-out API route
 * 
 * POST /api/auth/sign-out
 * Signs out the current user and clears their session
 */

import { createServerSupabaseClient } from '@/lib/clients/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign-out failed' 
      },
      { status: 500 }
    );
  }
}
