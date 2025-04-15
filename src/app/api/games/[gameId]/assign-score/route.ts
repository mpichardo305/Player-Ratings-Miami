import { NextRequest, NextResponse } from 'next/server'
import { updateGamePlayerWon, updateGameScore } from '@/app/lib/updateGameService'
import { supabase } from '@/app/utils/supabaseClient'

export async function PUT(request: Request) {
  try {
    const gameId = request.url.split('/games/')[1].split('/')[0]
    const { scoreA, scoreB } = await request.json()
    
    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
    }

    // Calculate winner based on scores
    let winner: 'A' | 'B' | 'tie' = 'tie'
    if (scoreA > scoreB) {
      winner = 'A'
    } else if (scoreB > scoreA) {
      winner = 'B'
    }else if (scoreA === scoreB) {
      winner = 'tie'
    }

    // Update game score
    await updateGameScore(gameId, scoreA, scoreB, winner);
    
    // Update players' game outcomes
    await updateGamePlayerWon(gameId, winner);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const gameId = request.url.split('/games/')[1].split('/')[0];
    
    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }
    
    const { data: game, error } = await supabase
      .from('game_score')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) throw error;
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}