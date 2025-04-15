import { NextRequest, NextResponse } from 'next/server';
import { updateTeams } from '../../../../lib/updateGameService';

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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'PUT',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}