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
