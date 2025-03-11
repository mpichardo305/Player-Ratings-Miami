import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import { parse, format } from 'date-fns';

// GET handler for fetching a game by ID
export async function GET(
  request: NextRequest,
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
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    
    console.log('Updating game with data:', body);
    console.log('Time format received:', body.start_time);
    
    // For timestamptz column, we need a complete ISO timestamp
    let fullTimestamp;
    
    if (body.date && body.start_time) {
      // Extract the date portion from the ISO string
      const datePart = body.date.split('T')[0];
      
      // Convert and validate time format
      let timepart = body.start_time;
      
      // Try to normalize the time format if it doesn't match already
      if (!timepart.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)) {
        console.log('Invalid time format detected, attempting to fix:', timepart);
        
        // Try to handle different time formats
        if (timepart.includes('PM') || timepart.includes('AM')) {
          // Handle 12-hour format (like "8:00 PM")
          try {
            const dt = parse(timepart, 'h:mm a', new Date());
            timepart = format(dt, 'HH:mm:ss');
            console.log('Converted 12-hour format to 24-hour:', timepart);
          } catch (e) {
            console.error('Failed to parse 12-hour format:', e);
          }
        } else {
          // Try to add seconds if missing
          if (timepart.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            timepart = `${timepart}:00`;
            console.log('Added seconds to time:', timepart);
          }
        }
      }
      
      // Final validation
      if (!timepart.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)) {
        console.error('Invalid time format after fixes:', timepart);
        return NextResponse.json(
          { 
            error: 'Invalid time format. Expected HH:MM:SS',
            receivedFormat: timepart 
          },
          { status: 400 }
        );
      }
      
      // Create a complete ISO8601 timestamp with timezone (Z = UTC)
      fullTimestamp = `${datePart}T${timepart}.000Z`;
      console.log('Created full timestamp:', fullTimestamp);
    } else {
      console.error('Missing date or time:', body.date, body.start_time);
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      );
    }
    
    console.log('Full timestamp for database:', fullTimestamp);
    
    const { data, error } = await supabase
      .from('games')
      .update({
        field_name: body.field_name,
        date: body.date,
        start_time: fullTimestamp, // Use the complete timestamptz format
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
