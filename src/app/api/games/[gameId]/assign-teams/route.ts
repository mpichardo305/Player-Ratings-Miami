import { NextRequest, NextResponse } from 'next/server';
import { updateTeams } from '../../../../lib/updateGameService';
import { supabase } from '@/app/utils/supabaseClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function PUT(
  request: NextRequest,
  context: any
) {
  console.log('PUT assign teams received');
  
  try {
    const gameId = context.params.gameId;
    const requestBody = await request.json();
    console.log('Request body:', requestBody);

    if (!gameId) {
      console.error('Missing gameId in params');
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    await updateTeams(gameId, requestBody);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in assign-teams route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { gameId: string } }
) {
  try {
    const gameId = context.params.gameId;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_players')
      .select('player_id, player_name, team')
      .eq('game_id', gameId);

    if (error) {
      console.error('Error fetching team assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ players: data });

  } catch (error) {
    console.error('Unexpected error in get-teams route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}