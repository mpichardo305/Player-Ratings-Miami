import { fetchGroupPlayers } from "./playerDb";
import { supabase } from "./supabaseClient";

interface PlayerStats {
  player_id: string;
  name: string;
  value: number;
  gamesPlayed?: number;
}

export type BestPlayer = {
  player_id: string;
  name: string;
  value: number;
  gamesPlayed: number;
};

interface GameResult {
  player_id: string;
  created_at: string;
  game_outcome: string;
}

interface GamePlayerResponse {
  game_id: string;
  player_id: string;
  players: {
    name: string;
  } | null;
}

interface GameRatingResponse {
  player_id: string;
  rating: number;
  game_id: string;
  players: {
    name: string;
  };
}

interface PlayerWinRatio {
  player_id: string;
  name: string;
  win_ratio: number;
  totalGames: number;    // ← new
}

interface GamePlayerWithGames {
  game_id: string;
  player_id: string;
  games: {
    date: string;
    start_time: string;
  };
  players: {
    name: string;
  };
}

export async function getPlayerWinRatios(groupId: string): Promise<PlayerWinRatio[] | null> {
  const groupPlayers = await fetchGroupPlayers(groupId);
  if (groupPlayers.length === 0) {
    console.log('No players found in group:', groupId);
    return null;
  }
  const playerIds = groupPlayers.map(player => player.id);

  const { data, error } = await supabase
    .from('game_players')
    .select(`
      player_id,
      game_outcome,
      player_name
    `);

  if (error || !data) {
    console.error('Error fetching player win ratios:', error);
    return null;
  }

  console.log('\n--- Player Win Ratio Calculations ---');
  console.log('Total game records fetched:', data.length);

  const rawStats = data.reduce((acc, { player_id, game_outcome, player_name }) => {
    if (!playerIds.includes(player_id)) return acc;
    const s = acc[player_id] ?? { totalGames: 0, wins: 0, name: player_name || '', player_id };
    s.totalGames++;
    if (game_outcome === 'win') s.wins++;
    acc[player_id] = s;
    return acc;
  }, {} as Record<string, { totalGames: number; wins: number; name: string; player_id: string }>);

  return Object.values(rawStats).map(s => ({
    player_id: s.player_id,
    name: s.name,
    win_ratio: Number(((s.wins / s.totalGames) * 100).toFixed(2)),
    totalGames: s.totalGames      // ← carry forward
  }));
}

export async function getGameData() {
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, date, start_time')
    .order('date', { ascending: false }); 

  if (gamesError || !games) {
    console.error('Error fetching games:', gamesError);
    return null;
  }

  console.log('Sample game data:', games[0]);

  return games;
}

export async function getMostGamesPlayed(groupId: string): Promise<PlayerStats | null> {
try{
  const groupPlayers = await fetchGroupPlayers(groupId);
  if (groupPlayers.length === 0) {
    console.log('No players found in group:', groupId);
    return null;
  }
  const playerIds = groupPlayers.map(player => player.id);
  const { data: gamePlayers, error: playersError } = await supabase
  .from('game_players')
  .select(`
    game_id,
    player_id,
    games!inner (
      id,
      group_id
    ),
    players!inner (
      name
    )
  `)
  .in('player_id', playerIds)
  .eq('games.group_id', groupId)
    .limit(1000) as { data: GamePlayerResponse[] | null; error: any };

  if (playersError || !gamePlayers || gamePlayers.length === 0) {
    console.error('Error fetching game count:', playersError);
    return null;
  }

  // Group and count games by player
  const playerCounts = gamePlayers.reduce((acc, curr) => {
    // TypeScript now knows the exact shape of curr.players
    if (!curr.players?.name) {
      console.log('Skipping player with missing data:', curr);
      return acc;
    }

    const count = (acc[curr.player_id]?.count || 0) + 1;
    acc[curr.player_id] = {
      count,
      name: curr.players.name
    };
    
    return acc;
  }, {} as Record<string, { count: number; name: string }>);

  // Rest of the function remains the same
  const entries = Object.entries(playerCounts);
  if (entries.length === 0) return null;

  const [playerId, playerData] = entries.sort((a, b) => b[1].count - a[1].count)[0];

  const result = {
    player_id: playerId,
    name: playerData.name,
    value: playerData.count
  };

  console.log(`Most games played in group ${groupId}:`, result);
  return result;

} catch (error) {
  console.error(`Error calculating most games played for group ${groupId}:`, error);
  return null;
}
}
function computeStrictStreak(orderedGameIds: string[], playedSet: Set<string>): number {
  let streak = 0;
  for (const gid of orderedGameIds) {
      if (playedSet.has(gid)) streak++;
      else break;
  }
  return streak;
}
export async function getStreakLeader(groupId: string): Promise<PlayerStats | null> {
    const groupPlayers = await fetchGroupPlayers(groupId);
    if (!groupPlayers.length) return null;

    const playerIds = groupPlayers.map(p => p.id);
    const { data: gpRows } = await supabase
      .from('game_players')
      .select(`
        game_id,
        player_id,
        games!inner(date, start_time),
        players(name)
      `)
      .in('player_id', playerIds)
      .eq('games.group_id', groupId)
      .limit(1000) as { data: GamePlayerWithGames[] | null };

    if (!gpRows?.length) return null;

    // build a map of game_id → Date
    const gameMap = new Map<string, Date>();
    gpRows?.forEach(r => {
      if (r.games?.date && r.games.start_time) {
        gameMap.set(r.game_id, new Date(`${r.games.date} ${r.games.start_time}`));
      }
    });

    // sort descending by timestamp
    const allGames = Array.from(gameMap.entries())
      .sort(([, a], [, b]) => b.getTime() - a.getTime())
      .map(([id]) => id);

    // build each player’s played‐set
    const participation = new Map<string, Set<string>>();
    gpRows.forEach(r => {
      const set = participation.get(r.player_id) || new Set<string>();
      set.add(r.game_id);
      participation.set(r.player_id, set);
    });

    // now use the helper
    let maxStreak: PlayerStats = { player_id: '', name: '', value: 0 };
    groupPlayers.forEach(({ id, name }) => {
      const playedSet = participation.get(id) || new Set();
      const streak = computeStrictStreak(allGames, playedSet);
      console.log(`Strict streak for ${name}: ${streak}`);
      if (streak > maxStreak.value) {
        maxStreak = { player_id: id, name, value: streak };
      }
    });

    return maxStreak.player_id ? maxStreak : null;
}

export async function getMostImproved(groupId: string): Promise<PlayerStats | null> {
  const groupPlayers = await fetchGroupPlayers(groupId);
  if (groupPlayers.length === 0) {
    console.log('No players found in group:', groupId);
    return null;
  }
  const playerIds = groupPlayers.map(player => player.id);
  const { data: gameRatings, error: ratingsError } = await supabase
  .from('game_ratings')
  .select(`
    player_id,
    rating,
    game_id,
    players (
      name
    )
  `)
  .limit(1000) as { data: GameRatingResponse[] | null; error: any };

  if (ratingsError || !gameRatings || gameRatings.length === 0) {
    console.error('Error fetching ratings:', ratingsError);
    return null;
  }

  // Group ratings by player and compute average per playerId
  const playerStats = gameRatings.reduce((acc, curr) => {
    if (!curr.players?.name) {
      console.log('Skipping rating with missing player name:', curr);
      return acc;
    }
    if (!playerIds.includes(curr.player_id)) {
      console.log(`Skipping rating for non‐group player ${curr.player_id}:`, curr);
      return acc;
    }

    const playerId = curr.player_id;
    const player = acc.get(playerId) || {
      name: curr.players.name,
      ratings: new Map<string, number>(), // Map of game_id to rating
      uniqueGames: new Set<string>()      // Set of unique game_ids
    };

    // Only store one rating per game
    player.ratings.set(curr.game_id, curr.rating);
    player.uniqueGames.add(curr.game_id);
    acc.set(playerId, player);
    return acc;
  }, new Map<string, { 
    name: string; 
    ratings: Map<string, number>; 
    uniqueGames: Set<string>;
  }>());

  let maxImprovement = { player_id: '', name: '', value: 0 };

  console.log('\n--- Player Improvement Details ---');
  const improvements: { name: string; improvement: number; firstAvg: number; lastAvg: number; gamesPlayed: number }[] = [];

  playerStats.forEach((stats, playerId) => {
    // Check if player has played at least 3 unique games
    if (stats.uniqueGames.size >= 3) {
      const ratingsArray = Array.from(stats.ratings.values());
      // Sort ratings chronologically (oldest to newest)
      ratingsArray.sort((a, b) => a - b);
      
      // Calculate average of first 3 games and last 3 games
      const firstThreeAvg = ratingsArray.slice(0, 3)
        .reduce((sum, rating) => sum + rating, 0) / 3;
      const lastThreeAvg = ratingsArray.slice(-3)
        .reduce((sum, rating) => sum + rating, 0) / 3;
      
      const improvement = lastThreeAvg - firstThreeAvg;

      improvements.push({
        name: stats.name,
        improvement,
        firstAvg: firstThreeAvg,
        lastAvg: lastThreeAvg,
        gamesPlayed: stats.uniqueGames.size
      });

      if (improvement > maxImprovement.value) {
        maxImprovement = {
          player_id: playerId,
          name: stats.name,
          value: Number(improvement.toFixed(1))
        };
      }
    }
  });

  // Sort and log improvements
  improvements
    .sort((a, b) => b.improvement - a.improvement)
    .forEach(({ name, improvement, firstAvg, lastAvg, gamesPlayed }) => {
      console.log(
        `Player ${name}:\n` +
        `  Games Played: ${gamesPlayed}\n` +
        `  Initial 3-Game Average: ${firstAvg.toFixed(1)}\n` +
        `  Latest 3-Game Average: ${lastAvg.toFixed(1)}\n` +
        `  Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}\n`
      );
    });

  console.log('\nMost Improved Player:', {
    name: maxImprovement.name,
    improvement: maxImprovement.value.toFixed(1)
  });

  return maxImprovement.player_id ? maxImprovement : null;
}

export async function getBestPlayer(groupId: string): Promise<BestPlayer | null> {
  try {
    const groupPlayers = await fetchGroupPlayers(groupId);
    if (groupPlayers.length === 0) {
      console.log('No players found in group:', groupId);
      return null;
    }
    const playerIds = groupPlayers.map(player => player.id);
    const { data: gameRatings, error: ratingsError } = await supabase
      .from('game_ratings')
      .select(`
        player_id,
        rating,
        game_id,
        players (
          name
        )
      `)
      .limit(1000) as { data: GameRatingResponse[] | null; error: any };

    if (ratingsError || !gameRatings || gameRatings.length === 0) {
      console.error('Error fetching ratings:', ratingsError);
      return null;
    }
    // Group ratings by player and compute average per playerId
    const playerStats = gameRatings.reduce((acc, curr) => {
      if (!curr.players?.name) {
        console.log('Skipping rating with missing player name:', curr);
        return acc;
      }
      if (!playerIds.includes(curr.player_id)) {
        console.log(`Skipping rating for non‐group player ${curr.player_id}:`, curr);
        return acc;
      }

      const pid = curr.player_id;
      const player = acc.get(pid) || {
        name: curr.players.name,
        ratings: new Map<string, number>(),
        uniqueGames: new Set<string>()
      };

      player.ratings.set(curr.game_id, curr.rating);
      player.uniqueGames.add(curr.game_id);
      acc.set(pid, player);
      return acc;
    }, new Map<string, { name: string; ratings: Map<string, number>; uniqueGames: Set<string> }>());

    console.log('After grouping, playerStats.size =', playerStats.size);
    console.log('Players in stats:', Array.from(playerStats.keys()));

    let bestPlayer: BestPlayer | null = null;

    playerStats.forEach((playerData, playerId) => {
      if (playerData.uniqueGames.size >= 3) {
        const ratingsArray = Array.from(playerData.ratings.values());
        const avg = ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length;

        if (bestPlayer === null || avg > bestPlayer.value || (avg === bestPlayer.value && playerData.uniqueGames.size > bestPlayer.gamesPlayed)) {
          bestPlayer = {
            player_id: playerId,
            name: playerData.name,
            value: Number(avg.toFixed(1)),
            gamesPlayed: playerData.uniqueGames.size // Store the number of games
          };
        }
      }
    });

    return bestPlayer;

  } catch (error) {
    console.error('Error calculating best player:', error);
    return null;
  }
}
export async function getHighestWinRatio(groupId: string): Promise<PlayerStats | null> {
  const winRatios = await getPlayerWinRatios(groupId);
  if (!winRatios?.length) return null;

  // only those with ≥3 games
  const candidates = winRatios.filter(p => p.totalGames >= 3);
  if (!candidates.length) return null;

  // reduce to the best by win_ratio, tie‑break by totalGames
  const best = candidates.reduce((bestSoFar, curr) => {
    if (
      curr.win_ratio > bestSoFar.win_ratio ||
      (curr.win_ratio === bestSoFar.win_ratio && curr.totalGames > bestSoFar.totalGames)
    ) {
      return curr;
    }
    return bestSoFar;
  }, candidates[0]);

  return {
    player_id: best.player_id,
    name: best.name,
    value: best.win_ratio,
    gamesPlayed: best.totalGames
  };
}

// Helper function to get the number of games played by a player
async function getPlayerGamesPlayed(playerId: string, groupId: string): Promise<number> {
  try {
    const playerStats = await getPlayerStats(playerId, groupId);
    if (!playerStats) return 0;

    const gamesPlayedStat = playerStats.find(stat => stat.name === "Games Played");
    return gamesPlayedStat ? gamesPlayedStat.value : 0;
  } catch (error) {
    console.error('Error fetching player games played:', error);
    return 0;
  }
}
export async function getPlayerStats(playerId: string, groupId: string): Promise<PlayerStats[] | null> {
  try {
    // Get win ratio data for the player
    const winRatios = await getPlayerWinRatios(groupId);
    const winRatioData = winRatios?.find(p => p.player_id === playerId);
    const playerWinRatio = winRatioData?.win_ratio || 0;
    const groupPlayers = await fetchGroupPlayers(groupId);
    if (groupPlayers.length === 0) {
      console.log('No players found in group:', groupId);
      return null;
    }
    const playerIds = groupPlayers.map(player => player.id);
    // Get game ratings data
    const { data: gameRatings, error: ratingsError } = await supabase
      .from('game_ratings')
      .select(`
        player_id,
        rating,
        game_id,
        players (
          name
        )
      `)
      .eq('player_id', playerId)
      .limit(1000) as { data: GameRatingResponse[] | null; error: any };

    // Get total wins data
    const { data: gameOutcomes, error: outcomesError } = await supabase
      .from('game_players')
      .select('game_outcome')
      .eq('player_id', playerId);

    if (ratingsError || !gameRatings || gameRatings.length === 0) {
      console.error('Error fetching ratings:', ratingsError);
      return null;
    }

    if (outcomesError) {
      console.error('Error fetching game outcomes:', outcomesError);
      return null;
    }

    // Calculate total wins
    const totalWins = gameOutcomes?.filter(game => game.game_outcome === 'win').length || 0;

    // Group ratings by player and compute average per playerId
    const playerStats = gameRatings.reduce((acc, curr) => {
      if (!curr.players?.name) {
        console.log('Skipping rating with missing player name:', curr);
        return acc;
      }
      if (!playerIds.includes(curr.player_id)) {
        console.log(`Skipping rating for non‐group player ${curr.player_id}:`, curr);
        return acc;
      }

      const playerId = curr.player_id;
      const player = acc.get(playerId) || {
        name: curr.players.name,
        ratings: new Map<string, number>(),  // Map of game_id to rating
        uniqueGames: new Set<string>()       // Set of unique game_ids
      };

      // Only store one rating per game
      player.ratings.set(curr.game_id, curr.rating);
      player.uniqueGames.add(curr.game_id);
      acc.set(playerId, player);
      return acc;
    }, new Map<string, {
      name: string;
      ratings: Map<string, number>;
      uniqueGames: Set<string>;
    }>());

    const playerData = playerStats.get(playerId);
    if (!playerData) return null;

    const ratingsArray = Array.from(playerData.ratings.values());
    const gamesPlayed = playerData.uniqueGames.size;

    // Calculate stats only if player has 3 or more games
    if (gamesPlayed >= 3) {
      // Sort ratings chronologically (oldest to newest)
      ratingsArray.sort((a, b) => a - b);
      
      // Calculate average of first 3 games and last 3 games
      const firstThreeAvg = ratingsArray.slice(0, 3)
        .reduce((sum, rating) => sum + rating, 0) / 3;
      const lastThreeAvg = ratingsArray.slice(-3)
        .reduce((sum, rating) => sum + rating, 0) / 3;
      
      const improvement = Number((lastThreeAvg - firstThreeAvg).toFixed(1));

      // Get recent games in chronological order
      const { data: recentGames, error: recentGamesError } = await supabase
        .from('game_players')
        .select('game_outcome')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (recentGamesError) {
        console.error('Error fetching recent games:', recentGamesError);
        return null;
      }

      // Calculate win streak
      let winStreak = 0;
      for (const game of recentGames || []) {
        if (game.game_outcome === 'win') {
          winStreak++;
        } else {
          break;
        }
      }
      let strictCurrentStreak = 0;

      // Match the exact query from getStreakLeader
      const groupPlayers = await fetchGroupPlayers(groupId);
      if (!groupPlayers.length) {
        strictCurrentStreak = 0; // Or handle the case where there are no group players
      } else {
        const playerIds = groupPlayers.map(p => p.id);
        const { data: gpRows } = await supabase
          .from('game_players')
          .select(`
            game_id,
            player_id,
            games!inner(date, start_time),
            players(name)
          `)
          .in('player_id', playerIds)
          .eq('games.group_id', groupId)
          .limit(1000) as { data: GamePlayerWithGames[] | null };

        if (!gpRows?.length) {
          strictCurrentStreak = 0; // Or handle the case where there are no game players
        } else {
          // build a map of game_id -> Date
          const gameMap = new Map<string, Date>();
          gpRows?.forEach(r => {
            if (r.games?.date && r.games.start_time) {
              gameMap.set(r.game_id, new Date(`${r.games.date} ${r.games.start_time}`));
            }
          });

          // sort descending by timestamp
          const allGames = Array.from(gameMap.entries())
            .sort(([, a], [, b]) => b.getTime() - a.getTime())
            .map(([id]) => id);

          // build each player’s played-set
          const participation = new Map<string, Set<string>>();
          gpRows.forEach(r => {
            const set = participation.get(r.player_id) || new Set<string>();
            set.add(r.game_id);
            participation.set(r.player_id, set);
          });

          // Calculate strictCurrentStreak for the specific player
          const playedSet = participation.get(playerId) || new Set();
          strictCurrentStreak = computeStrictStreak(allGames, playedSet);
          console.log(`Strict Current Streak for player ${playerId}: ${strictCurrentStreak}`);
        }
      }

      // Return stats array with win streak
      return [
        { player_id: playerId, name: "Games Played", value: gamesPlayed },
        { player_id: playerId, name: "Total Wins", value: totalWins },
        { player_id: playerId, name: "Games Played", value: gamesPlayed },
        { player_id: playerId, name: "Initial 3-Game Average", value: Number(firstThreeAvg.toFixed(1)) },
        { player_id: playerId, name: "Latest 3-Game Average", value: Number(lastThreeAvg.toFixed(1)) },
        { player_id: playerId, name: "Rating Improvement", value: improvement },
        { player_id: playerId, name: "Win Ratio", value: Number(playerWinRatio.toFixed(1)) },
        { player_id: playerId, name: "Win Streak", value: winStreak },
        { player_id: playerId, name: "Strict Current Streak", value: strictCurrentStreak }
      ];
    } else {
      // Return stats for players with less than 3 games
      return [
        { player_id: playerId, name: "Games Played", value: gamesPlayed },
        { player_id: playerId, name: "Total Wins", value: totalWins },
        { player_id: playerId, name: "Total Streak", value: gamesPlayed },
        { player_id: playerId, name: "Initial 3-Game Average", value: 0 },
        { player_id: playerId, name: "Latest 3-Game Average", value: 0 },
        { player_id: playerId, name: "Rating Improvement", value: 0 },
        { player_id: playerId, name: "Win Ratio", value: Number(playerWinRatio.toFixed(1)) },
        { player_id: playerId, name: "Win Streak", value: 0 }
      ];
    }

  } catch (error) {
    console.error('Error calculating player stats:', error);
    return null;
  }
}

export async function getLongestWinStreak(groupId: string): Promise<PlayerStats | null> {
  try {
    console.log('Calculating longest win streak for group:', groupId);
    const groupPlayers = await fetchGroupPlayers(groupId);
    if (groupPlayers.length === 0) {
      console.log('No players found in group:', groupId);
      return null;
    }

    const playerIds = groupPlayers.map(player => player.id);
    const { data: games, error } = await supabase
    .from('game_players')
      .select(`
        player_id,
        created_at,
        game_outcome
      `)
      .order('player_id')
      .order('created_at')
      .not('created_at', 'is', null) // Only include games with timestamps
      .not('game_outcome', 'is', null); // Only include games with outcomes

    if (error || !games || games.length === 0) {
      console.error('Error fetching game outcomes:', error);
      return null;
    }

    // Debug logging for verification
    console.log(`Found ${games.length} games for group ${groupId}`);

    const playerGames = games.reduce((acc, game) => {
      const playerId = game.player_id;
      
      // Skip if player is not in the group
      if (!playerIds.includes(playerId)) {
      return acc;
      }
    
      if (!acc[playerId]) {
      acc[playerId] = {
        games: [] as GameResult[]
      };
      }
    
      acc[playerId].games.push(game);
      return acc;
    }, {} as Record<string, { games: GameResult[] }>);

    let maxStreak = { player_id: '', value: 0 };

    // Calculate streaks for each player
    for (const [playerId, data] of Object.entries(playerGames)) {
      let currentStreak = 0;
      let maxPlayerStreak = 0;
      
      const sortedGames = data.games.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedGames.forEach(game => {
        if (game.game_outcome === 'win') {
          currentStreak++;
          maxPlayerStreak = Math.max(maxPlayerStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      if (maxPlayerStreak > maxStreak.value) {
        maxStreak = {
          player_id: playerId,
          value: maxPlayerStreak
        };
      }
    }

    const name = await fetchPlayerName(maxStreak.player_id);
    console.log(`Longest win streak for group ${groupId}:`, maxStreak);
    return maxStreak.value > 0 && name ? {
      ...maxStreak,
      name
    } : null;

  } catch (error) {
    console.error(`Error calculating longest win streak for group ${groupId}:`, error);
    return null;
  }
}

// Function to fetch player name from the players table
async function fetchPlayerName(playerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('players')
    .select('name')
    .eq('id', playerId)
    .single(); // Fetch a single record

  if (error || !data) {
    console.error('Error fetching player name:', error);
    return null;
  }

  return data.name;
}
