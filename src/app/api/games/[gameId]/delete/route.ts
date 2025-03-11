import { supabase } from '@/app/utils/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  console.log('DELETE received');
  console.log('Request params:', params);

  try {
    const gameId = params.gameId;
    // Remove the request.json() since we are not sending a request body in DELETE
    // const requestBody = await request.json();

    if (!gameId) {
      console.error('Missing gameId in params');
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);

    if (error) {
      console.error('Error deleting game:', error);
      return NextResponse.json({ error: 'Error deleting game' }, { status: 500 });
    }

    console.log('Successfully deleted game:', data);
    return NextResponse.json({ success: true, gameId });
  } catch (error) {
    console.error('Error in delete game route:', error);
    throw error;
  }
}