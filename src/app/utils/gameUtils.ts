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
  const { data: game } = await supabase
    .from('games')
    .select('date, start_time')
    .eq('id', gameId)
    .single();

  if (!game) throw new Error('Game not found');

  // Create dates using the local timezone
  const gameStart = new Date(`${game.date}T${game.start_time}`);
  const now = new Date();

  // Calculate difference in hours
  const diffMs = now.getTime() - gameStart.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Debug logging
  console.log({
    gameStartTime: gameStart.toLocaleString(),
    currentTime: now.toLocaleString(),
    diffHours: diffHours,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return diffHours;
};