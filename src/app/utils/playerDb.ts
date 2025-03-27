import { supabase } from "./supabaseClient";

export interface Player {
  id: string;      
  name: string;
  status: string;
}

export const fetchGroupPlayers = async (groupId: string): Promise<Player[]> => {
  try {
    // Fetch all memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from("group_memberships")
      .select(`
        status,
        players:players!inner (
          id,
          name,
          status
        )
      `)
      .eq("group_id", groupId);

    if (membershipsError || !memberships) {
      console.error("❌ Error fetching players:", membershipsError);
      return [];
    }

    const approvedPlayers: Player[] = memberships
      .filter((m) => m.status === "approved")  
      .flatMap((m) => m.players ?? [])
      .map((pl) => ({
        ...pl,
      }));

    return approvedPlayers;
  } catch (error) {
    console.error("Error in fetchGroupPlayers:", error);
    return [];
  }
};

export const fetchGamePlayers = async (gameId: string): Promise<Player[]> => {
  try {
    // First get player IDs from game_players
    const { data: playerRelations, error: relationsError } = await supabase
      .from('game_players')
      .select('player_id')
      .eq('game_id', gameId);

    if (relationsError || !playerRelations) {
      console.error("❌ Error fetching player relations:", relationsError);
      return [];
    }

    if (playerRelations.length === 0) {
      return [];
    }

    // Get the actual player details
    const playerIds = playerRelations.map(relation => relation.player_id);
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, status')
      .in('id', playerIds);

    if (playersError || !players) {
      console.error("❌ Error fetching player details:", playersError);
      return [];
    }

    return players;
  } catch (error) {
    console.error("Error in fetchGamePlayers:", error);
    return [];
  }
};

export const fetchExistingPlayerIds = async (gameId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('game_players')
      .select('player_id')
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error fetching existing players:', error);
      return [];
    }
    
    return data ? data.map(item => item.player_id) : [];
  } catch (error) {
    console.error('Error fetching existing player IDs:', error);
    return [];
  }
};
export async function getUserPlayerId(user_id: string): Promise<string | null> {
  try {
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user_id) 

    if (playersError || !players || players.length === 0) {
      console.error("❌ Error fetching player details:", playersError);
      return null; // Return null if there's an error or no players found
    }

    return players[0].id; // Return the player_id of the first player found
  } catch (error) {
    console.error("Error in getUserPlayerId:", error);
    return null; // Return null in case of an unexpected error
  }
}
