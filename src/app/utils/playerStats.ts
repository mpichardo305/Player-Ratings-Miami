import { supabase } from "./supabaseClient";

interface PlayerStats {
  player_id: string;
  name: string;
  value: number;
}

interface GamePlayer {
  player_id: string;
  games_played: number;
  games: {
    date: string;
    start_time: string;
  };
  players: {
    name: string;
  };
}

interface GameRating {
  player_id: string;
  rating: number;
  games: {
    date: string;
    start_time: string;
  };
  players: {
    name: string;
  } | null;
}

// Add this interface to properly type the Supabase response
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

interface PlayerWinRatio
 {
  player_id: string;
  name: string;
  win_ratio: number; 
}

export async function getPlayerWinRatios(): Promise<PlayerWinRatio[] | null> {
  const { data, error } = await supabase
    .from('game_players')
    .select(`
      player_id,
      game_outcome,
      players (
        name
      )
    `);

  if (error || !data) {
    console.error('Error fetching player win ratios:', error);
    return null;
  }

  console.log('\n--- Player Win Ratio Calculations ---');
  console.log('Total game records fetched:', data.length);

  const playerStats = data.reduce((acc, player) => {
    const { player_id, game_outcome, players } = player;

    if (!acc[player_id]) {
      acc[player_id] = {
        totalGames: 0,
        wins: 0,
        name: players?.[0]?.name || ''
      };
    }

    acc[player_id].totalGames += 1;
    if (game_outcome === 'win') {
      acc[player_id].wins += 1;
    }

    return acc;
  }, {} as Record<string, { totalGames: number; wins: number; name: string }>);

  console.log('\nRaw player statistics:');
  Object.entries(playerStats).forEach(([playerId, stats]) => {
    console.log(`Player: ${stats.name}`);
    console.log(`  Total Games: ${stats.totalGames}`);
    console.log(`  Wins: ${stats.wins}`);
  });

  const playerWinRatios = Object.entries(playerStats).map(([playerId, stats]) => {
    const winRatio = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
    console.log(`\nCalculating win ratio for ${stats.name}:`);
    console.log(`  ${stats.wins} wins / ${stats.totalGames} total games = ${winRatio.toFixed(2)}%`);
    
    return {
      player_id: playerId,
      name: stats.name,
      win_ratio: Number(winRatio.toFixed(2))
    };
  });

  console.log('\nFinal win ratios:');
  playerWinRatios.forEach(player => {
    console.log(`${player.name}: ${player.win_ratio}%`);
  });

  return playerWinRatios;
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

  return games;
}

export async function getMostGamesPlayed(): Promise<PlayerStats | null> {
  const { data: gamePlayers, error: playersError } = await supabase
    .from('game_players')
    .select(`
      game_id,
      player_id,
      players (
        name
      )
    `)
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

  return {
    player_id: playerId,
    name: playerData.name,
    value: playerData.count
  };
}


export async function getStreakLeader(): Promise<PlayerStats | null> {
  const { data: gamePlayers, error: playersError } = await supabase
    .from('game_players')
    .select(`
      game_id,
      player_id,
      games!inner (
        date,
        start_time
      ),
      players (
        name
      )
    `)
    .limit(1000) as { data: any[] | null; error: any };

  if (playersError || !gamePlayers || gamePlayers.length === 0) {
    console.error('Error fetching games for streak:', playersError);
    return null;
  }

  // Group games by player
  const playerGames = gamePlayers.reduce((acc, curr) => {
    if (!curr.players?.name || !curr.games?.date) {
      console.log('Skipping player with missing data:', curr);
      return acc;
    }

    const player = acc.get(curr.player_id) || {
      games: [],
      name: curr.players.name
    };

    player.games.push(new Date(`${curr.games.date} ${curr.games.start_time}`));
    acc.set(curr.player_id, player);
    return acc;
  }, new Map<string, { games: Date[], name: string }>());

  let maxStreak = { player_id: '', name: '', value: 0 };

  // Calculate streaks for each player
  playerGames.forEach((player: { games: any[]; name: any; }, playerId: any) => {
    // Sort games by date ascending
    player.games.sort((a, b) => b.getTime() - a.getTime());
    
    let currentStreak = 1;
    for (let i = 1; i < player.games.length; i++) {
      const daysDiff = Math.abs((player.games[i].getTime() - player.games[i-1].getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        currentStreak++;
      } else {
        break;
      }
    }

    console.log(`Player ${player.name}: ${currentStreak} game streak`); // Debug log

    if (currentStreak > maxStreak.value) {
      maxStreak = {
        player_id: playerId,
        name: player.name,
        value: currentStreak
      };
    }
  });

  console.log('Final streak leader:', maxStreak); // Debug log
  return maxStreak.player_id ? maxStreak : null;
}

export async function getMostImproved(): Promise<PlayerStats | null> {
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

  // Group ratings by player
  const playerStats = gameRatings.reduce((acc, curr) => {
    if (!curr.players?.name) {
      console.log('Skipping rating with missing player data:', curr);
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

export async function getBestPlayer(): Promise<PlayerStats | null> {
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

  // Group ratings by player and calculate averages
  const playerStats = gameRatings.reduce((acc, curr) => {
    if (!curr.players?.name) {
      console.log('Skipping player with missing data:', curr);
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

  let bestPlayer: PlayerStats | null = null;
  let highestAverage = 0;

  console.log('\n--- Player Rating Averages ---');
  playerStats.forEach((stats, playerId) => {
    // Check if player has played at least 3 unique games
    if (stats.uniqueGames.size >= 3) {
      // Calculate average using ratings from unique games
      const ratingsArray = Array.from(stats.ratings.values());
      const average = ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length;
      
      console.log(`Player ${stats.name}:`, {
        uniqueGames: stats.uniqueGames.size,
        gamesRated: ratingsArray.length,
        averageRating: average.toFixed(1)
      });

      if (average > highestAverage) {
        highestAverage = average;
        bestPlayer = {
          player_id: playerId,
          name: stats.name,
          value: Number(average.toFixed(1))
        };
      }
    }
  });

  console.log('\nBest Player:', bestPlayer);
  return bestPlayer;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats[] | null> {
  try {
    // Get win ratio data for the player
    const winRatios = await getPlayerWinRatios();
    const winRatioData = winRatios?.find(p => p.player_id === playerId);
    const playerWinRatio = winRatioData?.win_ratio || 0;

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

    // Group ratings by player
    const playerStats = gameRatings.reduce((acc, curr) => {
      if (!curr.players?.name) {
        console.log('Skipping rating with missing player data:', curr);
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
      const { data: recentGames, error: gamesError } = await supabase
        .from('game_players')
        .select('game_outcome')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (gamesError) {
        console.error('Error fetching recent games:', gamesError);
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

      // Return stats array with win streak
      return [
        { player_id: playerId, name: "Games Played", value: gamesPlayed },
        { player_id: playerId, name: "Total Wins", value: totalWins },
        { player_id: playerId, name: "Current Streak", value: gamesPlayed },
        { player_id: playerId, name: "Initial 3-Game Average", value: Number(firstThreeAvg.toFixed(1)) },
        { player_id: playerId, name: "Latest 3-Game Average", value: Number(lastThreeAvg.toFixed(1)) },
        { player_id: playerId, name: "Rating Improvement", value: improvement },
        { player_id: playerId, name: "Win Ratio", value: Number(playerWinRatio.toFixed(1)) },
        { player_id: playerId, name: "Win Streak", value: winStreak }
      ];
    } else {
      // Return stats for players with less than 3 games
      return [
        { player_id: playerId, name: "Games Played", value: gamesPlayed },
        { player_id: playerId, name: "Total Wins", value: totalWins },
        { player_id: playerId, name: "Current Streak", value: gamesPlayed },
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

export async function getLongestWinStreak(): Promise<PlayerStats | null> {
  try {
    const { data: games, error } = await supabase
      .from('game_players')
      .select(`
        player_id,
        created_at,
        game_outcome,
        players!inner (
          name
        )
      `)
      .order('player_id')
      .order('created_at')
      .not('created_at', 'is', null) // Only include games with timestamps
      .not('game_outcome', 'is', null); // Only include games with outcomes

    if (error || !games || games.length === 0) {
      console.error('Error fetching game outcomes:', error);
      return null;
    }

    // Group games by player
    const playerGames = games.reduce((acc, game) => {
      if (!acc[game.player_id]) {
        acc[game.player_id] = {
          name: game.players[0].name,
          games: []
        };
      }
      acc[game.player_id].games.push(game);
      return acc;
    }, {} as Record<string, { name: string; games: typeof games }>) ;

    let maxStreak = { player_id: '', name: '', value: 0 };

    // Calculate streaks for each player
    Object.entries(playerGames).forEach(([playerId, data]) => {
      let currentStreak = 0;
      let maxPlayerStreak = 0;
      
      // Sort games by created_at
      const sortedGames = data.games.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Calculate streaks
      sortedGames.forEach(game => {
        if (game.game_outcome === 'win') {
          currentStreak++;
          maxPlayerStreak = Math.max(maxPlayerStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      // Update max streak if this player has a higher streak
      if (maxPlayerStreak > maxStreak.value) {
        maxStreak = {
          player_id: playerId,
          name: data.name,
          value: maxPlayerStreak
        };
      }
    });

    console.log('Longest win streak found:', maxStreak);
    return maxStreak.value > 0 ? maxStreak : null;

  } catch (error) {
    console.error('Error calculating longest win streak:', error);
    return null;
  }
}

