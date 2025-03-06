import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

const BASE_URL = '/api/games'; // review this

export interface GamePlayers {
  players: string[];
}

export interface Game {
  id: string;
}

export const updateGamePlayers = async (gameId: string, players: GamePlayers): Promise<Game> => {
  console.log(`Updating players for game ${gameId}`, players);
  
  try {
    const url = `${BASE_URL}/${gameId}/players`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(players),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`Failed to update game players: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error in updateGamePlayers:', error);
    throw error;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  console.log('PUT /api/update-game-players received');
  console.log('Request params:', params);
  
  try {
    const gameId = params.gameId;
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    if (!gameId) {
      console.error('Missing gameId in params');
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }
    
    if (!requestBody.players || !Array.isArray(requestBody.players)) {
      console.error('Invalid players data:', requestBody);
      return NextResponse.json({ error: 'Invalid players data' }, { status: 400 });
    }
    
    console.log(`Adding ${requestBody.players.length} players to game ${gameId}`);
    
    // Insert game_players records
    const { data, error } = await supabase
      .from('game_players')
      .insert(
        requestBody.players.map((playerId: string) => ({
          game_id: gameId,
          player_id: playerId,
        }))
      );
    
    if (error) {
      console.error('Error inserting game players:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Successfully added players to game:', data);
    return NextResponse.json({ success: true, gameId });
    
  } catch (error) {
    console.error('Unexpected error in update-game-players route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}