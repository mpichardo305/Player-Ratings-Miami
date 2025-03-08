import { NextRequest, NextResponse } from 'next/server';
import { updateGamePlayers } from '../../lib/updateGamePlayersService';

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

    const updatedGame = await updateGamePlayers(gameId, requestBody);
    
    return NextResponse.json({ success: true, gameId: updatedGame.id });

  } catch (error) {
    console.error('Unexpected error in update-game-players route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}