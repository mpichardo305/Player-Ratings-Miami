import { supabase } from "./supabaseClient";

/**
 * Determines if a game has ended based on its date and start time
 * @param gameDate The date of the game in YYYY-MM-DD format
 * @param gameStartTime The start time of the game in HH:MM:SS format
 * @param hoursAfterStart Hours after the start time to consider the game ended (default: 1)
 * @returns boolean indicating if the game has ended
 */
export const hasGameEnded = (gameDate: string, gameStartTime: string, hoursAfterStart: number = 1): boolean => {
  const now = new Date();
  const gameDateTime = new Date(`${gameDate}T${gameStartTime}`);
  
  // Add the specified hours to game time to consider it "ended"
  gameDateTime.setHours(gameDateTime.getHours() + hoursAfterStart);
  
  return now > gameDateTime;
};
/**
 * Calculates the time (in hours) that has passed since a game started
 * @param gameId - The ID of the game to check
 * @returns number of hours passed since game start time (negative if game hasn't started yet)
 */
export const checkTimeSinceGameStarted = async (gameId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('games')
    .select('date, start_time')
    .eq('id', gameId)
    .single();

  if (error) {
    console.error('Error fetching game details:', error);
    throw new Error('Failed to fetch game details');
  }

  if (!data) {
    throw new Error('Game not found');
  }

  // Combine date and start_time to create game start datetime
  const gameDate = new Date(data.date);
  const [hours, minutes] = data.start_time.split(':');
  const isPM = data.start_time.toLowerCase().includes('pm');
  
  let hour = parseInt(hours);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  gameDate.setHours(hour);
  gameDate.setMinutes(parseInt(minutes));

  // Get current time
  const now = new Date();
  
  // Calculate difference in milliseconds
  const timeDifference = now.getTime() - gameDate.getTime();
  
  // Convert to hours and return
  return timeDifference / (1000 * 60 * 60);
};