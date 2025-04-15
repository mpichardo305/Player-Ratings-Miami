import { NextRequest, NextResponse } from 'next/server'
import { updateTeams } from '@/app/lib/updateGameService'
import { supabase } from '@/app/utils/supabaseClient'

export async function PUT(request: Request) {
  try {
    const gameId = request.url.split('/games/')[1].split('/')[0]
    const teams = await request.json()
    
    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
    }

    await updateTeams(gameId, teams)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Get gameId from URL path segments
    const gameId = request.url.split('/games/')[1].split('/')[0]
    
    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('game_players')
      .select('player_id, player_name, team')
      .eq('game_id', gameId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ players: data })
  } catch (error) {
    console.error('Error in GET handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}