import { format } from 'date-fns';
import supabase from "./supabase";

export interface GameCreate {
  id?: string;
  game_id?: string;
  field_name: string; // Changed from fieldName
  date: Date; // ✅ Ensure this is a valid Date object
  start_time: string; // Example: "8:00 PM"
  created_at?: Date;
  updated_at?: Date;
  group_id: string;
}

export interface Game extends GameCreate {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

function convertToTimestamp(date: string | Date, time: string): string {
  // Ensure date is a string in "yyyy-MM-dd" format
  const dateObj = new Date(date);
  const dateString = format(dateObj, 'yyyy-MM-dd');

  // Extract hours and minutes from the time string
  const match = time.match(/(\d+):(\d+) (\w{2})/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let [_, hour, minute, period] = match;
  let hours = parseInt(hour, 10);

  if (period.toUpperCase() === 'PM' && hours < 12) {
    hours += 12; // Convert PM hours
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0; // Convert 12 AM to 00
  }

  // Create a full Date object with combined date and time
  const fullDate = new Date(`${dateString}T${hours.toString().padStart(2, '0')}:${minute}:00Z`);

  // Return as SQL-compatible timestamp
  return format(fullDate, 'yyyy-MM-dd HH:mm:ss');
}

export const createGame = async (gameData: GameCreate): Promise<Game> => {
  console.log('🎮 Creating new game with data:', gameData);
  const sqlDate = format(new Date(gameData.date), 'yyyy-MM-dd HH:mm:ss');
  const start_time = convertToTimestamp(sqlDate, gameData.start_time);
  const { data, error } = await supabase
    .from('games')
    .insert([
      {
        id: gameData.id, 
        field_name: gameData.field_name,
        date: sqlDate, // ✅ Ensures proper SQL format
        start_time: start_time, // ✅ Fix this
        created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        updated_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        group_id: gameData.group_id,
      }
    ])
    .select()
    .single(); // Get the newly created row

  if (error) {
    console.error('🚨 Error inserting game into DB:', error);
    throw new Error(error.message);
  }

  console.log('✅ Game created in DB:', data);

  return data as Game;
};