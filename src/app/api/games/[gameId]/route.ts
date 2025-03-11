import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import { parse, format } from 'date-fns';

// GET handler for fetching a game by ID
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { gameId } = context.params;
    
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (error) {
      console.error('Error fetching game:', error);
      return NextResponse.json(
        { error: 'Failed to fetch game' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT handler for updating a game
export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const gameId = context.params.gameId;
    const body = await request.json();
    
    console.log('Updating game with data:', body);
    
    if (body.start_time) {
      console.log(`Time format received: ${body.start_time}`);
      
      // If it's already in the format HH:MM:SS, keep it as is
      if (/^\d{2}:\d{2}:\d{2}$/.test(body.start_time)) {
        console.log(`Time is already in correct format: ${body.start_time}`);
      }
      // If it's a full timestamp, extract only the time part
      else if (body.start_time.includes('T')) {
        const timePart = body.start_time.split('T')[1]?.split('.')[0];
        if (timePart) {
          console.log(`Extracting time from timestamp: ${timePart}`);
          body.start_time = timePart;
        }
      }
      // Don't attempt to create a full timestamp - the database wants just time
    }
    
    const { data, error } = await supabase
      .from('games')
      .update({
        field_name: body.field_name,
        date: body.date,
        start_time: body.start_time, // Use the properly formatted time string
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)
      .select();
    
    if (error) {
      console.error('Error updating game:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0] || {});
  } catch (error) {
    console.error('Error in PUT handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
