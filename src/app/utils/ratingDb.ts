import { supabase } from './supabaseClient';

export type GameRater = {
  player_id: string;
  name: string;
  submitted_at: string;
};

type GameRatingData = {
  player_id_rater: string;
  player: {
    name: string;
  };
  created_at: string;
}

export async function fetchGameRaters(gameId: string): Promise<GameRater[]> {
  // First, get all unique rater IDs for this game
  const { data: raterIds, error: ratersError } = await supabase
    .from('game_ratings')
    .select('player_id_rater, created_at')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (ratersError) {
    console.error('Error fetching rater IDs:', ratersError);
    throw ratersError;
  }

  if (!raterIds || raterIds.length === 0) {
    return [];
  }

  // Get unique rater IDs
  const uniqueRaterIds = [...new Set(raterIds.map(r => r.player_id_rater))];

  // Fetch player details for each rater
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, name')
    .in('id', uniqueRaterIds);

  if (playersError) {
    console.error('Error fetching player details:', playersError);
    throw playersError;
  }

  if (!players) {
    return [];
  }

  // Map players to GameRater format
  const raters: GameRater[] = players.map(player => ({
    player_id: player.id,
    name: player.name,
    submitted_at: raterIds.find(r => r.player_id_rater === player.id)?.created_at || new Date().toISOString()
  }));

  return raters;
}