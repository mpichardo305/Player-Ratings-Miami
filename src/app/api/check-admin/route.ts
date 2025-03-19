import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const groupId = searchParams.get('groupId');

  // Validate required parameters
  if (!playerId || !groupId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user is an admin of the group
    const { data, error } = await supabase
      .from('group_admins')
      .select('player_id')
      .eq('player_id', playerId)
      .eq('group_id', groupId)
      .limit(1)
      .single();

    // Handle the case where no rows are found
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to check admin status' },
        { status: 500 }
      );
    }

    const isAdmin = data !== null;

    return NextResponse.json({ isAdmin });
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}