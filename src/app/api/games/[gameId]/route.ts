import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    
    // Extract the user claims from the request
    // In a real implementation, you'd get this from a server-side session
    // This is a placeholder for where you'd check the user's admin status
    const playerId = '3e0a04fb-6e4b-41ee-899f-a7f1190b57f5'; // Example - you'd get this from auth
    
    // First, get the game to check its group_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('group_id')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      console.error('Error fetching game:', gameError);
      return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
    }
    
    // Check if the user is an admin for this group
    const { data: isAdmin, error: adminError } = await supabase
      .from('group_admins')
      .select('id')
      .eq('player_id', playerId)
      .eq('group_id', game.group_id)
      .maybeSingle();
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }
    
    // If not admin, deny access
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this game' }, 
        { status: 403 }
      );
    }
    
    // Proceed with the update
    const { data, error } = await supabase
      .from('games')
      .update({
        field_name: body.field_name,
        start_time: body.start_time,
        // Add other fields as needed
      })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
