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
    // Step 1: Delete existing players for this game
    const { error: deleteError } = await supabase
      .from('game_players')
      .delete()
      .eq('game_id', gameId);

    if (deleteError) {
      console.error('Error deleting existing game players:', deleteError);
      throw new Error(deleteError.message);
    }

    console.log(`Adding ${players.players.length} players to game ${gameId}`);

    // Step 2: Get player names from the players table
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .in('id', players.players);

    if (playerError) {
      console.error('Error fetching player names:', playerError);
      throw new Error(playerError.message);
    }

    // Step 3: Create a mapping of player IDs to names
    const playerNameMap = new Map();
    playerData?.forEach(player => {
      playerNameMap.set(player.id, player.name);
    });

    // Step 4: Insert new game_players records
    const { data, error } = await supabase
      .from('game_players')
      .insert(
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

    console.log('Successfully updated players for game:', data);
    return { id: gameId };
  } catch (error) {
    console.error('Error in updateGamePlayers:', error);
    throw error;
  }
};

interface TeamUpdate {
  playerId: string;
  team: 'A' | 'B';
}

export const updateTeams = async (gameId: string, teamUpdates: TeamUpdate[]): Promise<void> => {
  try {
    if (!gameId || !teamUpdates.length) {
      throw new Error('Missing gameId or team updates');
    }

    // Fetch existing game_players for the specified game
    const { data: existingPlayers, error: fetchError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .in(
        'player_id',
        teamUpdates.map(update => update.playerId)
      );

    if (fetchError) {
      console.error('Error fetching game players:', fetchError);
      throw new Error(fetchError.message);
    }

    // Update each player's team
    for (const update of teamUpdates) {
      const { error: updateError } = await supabase
        .from('game_players')
        .update({ team: update.team })
        .eq('game_id', gameId)
        .eq('player_id', update.playerId);

      if (updateError) {
        console.error(`Error updating team for player ${update.playerId}:`, updateError);
        throw new Error(updateError.message);
      }
    }

    console.log('Successfully updated teams for game:', gameId);
  } catch (error) {
    console.error('Error in updateTeam:', error);
    throw error;
  }
};