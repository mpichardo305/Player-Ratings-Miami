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

    // First, get player names from the players table
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .in('id', players.players);

    if (playerError) {
      console.error('Error fetching player names:', playerError);
      throw new Error(playerError.message);
    }

    // Create a mapping of player IDs to names
    const playerNameMap = new Map();
    playerData?.forEach(player => {
      playerNameMap.set(player.id, player.name);
    });

    // Insert game_players records with player names
    const { data, error } = await supabase
      .from('game_players')
      .upsert(
        players.players.map((playerId: string) => ({
          game_id: gameId,
          player_id: playerId,
          player_name: playerNameMap.get(playerId) || 'N/A',
          
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