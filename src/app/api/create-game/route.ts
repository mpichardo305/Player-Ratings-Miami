// app/api/create-game/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createGame, GameCreate } from '../../lib/gameService';

export async function POST(request: NextRequest) {
  try {
    const gameData: GameCreate = await request.json();
    console.log('game data:', gameData);

    const createdGame = await createGame(gameData);

    return NextResponse.json(createdGame, { status: 201 });

  } catch (error) {
    console.error('🚨 Error in createGame route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}