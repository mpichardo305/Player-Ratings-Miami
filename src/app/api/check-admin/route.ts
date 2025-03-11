import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

    if (!userId || !groupId) {
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    console.log(`API checking admin for userId=${userId}, groupId=${groupId}`);

    const { data, error } = await supabase
      .from('group_admins')
      .select('id')
      .eq('player_id', userId)
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
    }

    const isAdmin = !!data;
    console.log('Admin check result:', isAdmin);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
