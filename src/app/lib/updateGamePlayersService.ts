import { supabase } from '@/app/utils/supabaseClient';

export interface GamePlayers {
  players: string[];
}

export interface Game {
  id: string;
}

// Function to update game players in the database
export const updateGamePlayers = async (gameId: string, players: GamePlayers): Promise<Game> => {
  console.log(`Updating players for game ${gameId}`, players);

  if (!gameId) {
    throw new Error('Missing gameId');
  }

  if (!players.players || !Array.isArray(players.players)) {
    throw new Error('Invalid players data');
  }

  try {
    console.log(`Adding ${players.players.length} players to game ${gameId}`);

    // Insert game_players records
    const { data, error } = await supabase
      .from('game_players')
      .upsert(
        players.players.map((playerId: string) => ({
          game_id: gameId,
          player_id: playerId,
        }))
      );

    if (error) {
      console.error('Error inserting game players:', error);
      throw new Error(error.message);
    }

    console.log('Successfully added players to game:', data);
    return { id: gameId };
  } catch (error) {
    console.error('Error in updateGamePlayers:', error);
    throw error;
  }
};