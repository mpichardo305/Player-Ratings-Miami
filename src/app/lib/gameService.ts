import { format } from 'date-fns';
import supabase from './supabase';
import { formatDateOnly, formatTimeOnly } from '../utils/dateUtils';

export interface GameCreate {
  id?: string;
  game_id?: string;
  field_name: string; // Changed from fieldName
  date: string; 
  start_time: string; // Example: "8:00 PM"
  created_at?: Date;
  updated_at?: Date;
  group_id?: string;
}

export interface Game extends GameCreate {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts the provided date (Eastern Time) and time string (e.g., "8:00 PM")
 * into a proper UTC timestamp for database storage.
 */
function convertToUTC(date: Date, time: string): string {
  if (!date || !time) throw new Error('Invalid date or time provided');

  // Convert date to "YYYY-MM-DD" format
  const dateString = format(date, 'yyyy-MM-dd');

  // Extract hour, minute, and AM/PM from the selected time
  const match = time.match(/(\d+):(\d+) (\w{2})/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let [_, hour, minute, period] = match;
  let hours = parseInt(hour, 10);

  // Convert 12-hour format to 24-hour format
  if (period.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  // Create Eastern Time date object
  const easternDate = new Date(`${dateString}T${hours.toString().padStart(2, '0')}:${minute}:00`);

  // Convert to UTC and format for SQL storage
  return format(easternDate, "yyyy-MM-dd HH:mm:ss'Z'");
}

/**
 * Creates a new game in the database and stores all timestamps in UTC.
 */
export const createGame = async (gameData: GameCreate): Promise<Game> => {
  console.log('🎮 Creating new game with data:', gameData);
  
  // Ensure `created_at` and `updated_at` timestamps are in UTC
  const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ss'Z'");
  const updatedAt = format(new Date(), "yyyy-MM-dd HH:mm:ss'Z'");

  // Insert into Supabase
  const { data, error } = await supabase
    .from('games')
    .insert([
      {
        id: gameData.id, 
        field_name: gameData.field_name,
        date: formatDateOnly(gameData.date), 
        start_time: formatTimeOnly(gameData.start_time), 
        created_at: createdAt,
        updated_at: updatedAt,
        group_id: gameData.group_id,
      }
    ])
    .select()
    .single(); 

  if (error) {
    console.error('🚨 Error inserting game into DB:', error);
    throw new Error(error.message);
  }

  console.log('✅ Game created in DB:', data);

  return data as Game;
};

export async function updateGame(gameId: string, gameData: Partial<GameCreate>) {
  try {
    // Make sure start_time is sent as a string directly without further processing
    const response = await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData), // Send the data as provided without manipulation
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update game');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateGame:', error);
    throw error;
  }
}