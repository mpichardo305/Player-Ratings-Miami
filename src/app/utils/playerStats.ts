import { supabase } from "./supabaseClient";

interface PlayerStats {
  player_id: string;
  name: string;
  value: number;
}

interface GamePlayer {
  player_id: string;
  games_played: number;
  players: {
    name: string;
  }[];
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
  }[];
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
    .limit(1000);

  if (playersError || !gamePlayers || gamePlayers.length === 0) {
    console.error('Error fetching game count:', playersError);
    return null;
  }

  // Add debug logging
  console.log('Total game players found:', gamePlayers.length);
  console.log('Sample players:', gamePlayers.slice(0, 3));

  // Group and count games by player
  const playerCounts = gamePlayers.reduce((acc, curr) => {
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

  // Log player counts for debugging
  console.log('Player counts:', playerCounts);

  // Find player with most games
  const entries = Object.entries(playerCounts);
  if (entries.length === 0) return null;

  const [playerId, playerData] = entries.sort((a, b) => b[1].count - a[1].count)[0];

  return {
    player_id: playerId,
    name: playerData.name,
    value: playerData.count
  };
}

// export async function getMostImproved(): Promise<PlayerStats | null> {
//   const games = await getGameData();
//   if (!games) return null;

//   const gameIds = games.map(game => game.id);

//   const { data, error } = await supabase
//     .from('game_ratings')
//     .select(`
//       player_id,
//       rating,
//       game_id,
//       games!inner (
//         date,
//         start_time
//       ),
//       players!inner (
//         name
//       )
//     `)
//     .in('game_id', gameIds)
//     .order('games.date', { ascending: false }); // Changed to games.date

//   if (error || !data) {
//     console.error('Error fetching ratings:', error);
//     return null;
//   }

//   // Group by player and calculate improvement
//   const improvements = (data as unknown as GameRating[]).reduce((acc, curr) => {
//     const player = acc.get(curr.player_id) || { 
//       ratings: [], 
//       name: curr.players[0]?.name || '',
//       dates: []
//     };
    
//     try {
//       if (curr.games?.date && curr.games?.start_time) {
//         const dateStr = `${curr.games.date} ${curr.games.start_time}`;
//         const date = new Date(dateStr);
        
//         // Validate the date is valid before adding
//         if (!isNaN(date.getTime())) {
//           player.ratings.push(curr.rating);
//           player.dates.push(date);
//         } else {
//           console.error('Invalid date created:', dateStr);
//         }
//       }
//     } catch (error) {
//       console.error('Error parsing date:', error, {
//         date: curr.games?.date,
//         time: curr.games?.start_time,
//         player: curr.player_id
//       });
//     }
    
//     acc.set(curr.player_id, player);
//     return acc;
//   }, new Map<string, { ratings: number[], dates: Date[], name: string }>());

//   let maxImprovement = { player_id: '', name: '', value: 0 };
  
//   improvements.forEach((player, playerId) => {
//     if (player.ratings.length >= 2) {
//       // Sort ratings by date before calculating improvement
//       const ratingsByDate = player.ratings
//         .map((rating, i) => ({ rating, date: player.dates[i] }))
//         .sort((a, b) => b.date.getTime() - a.date.getTime())
//         .map(item => item.rating);
      
//       const improvement = ratingsByDate[0] - ratingsByDate[ratingsByDate.length - 1];
//       if (improvement > maxImprovement.value) {
//         maxImprovement = {
//           player_id: playerId,
//           name: player.name,
//           value: improvement
//         };
//       }
//     }
//   });

//   return maxImprovement.player_id ? maxImprovement : null;
// }

// export async function getStreakLeader(): Promise<PlayerStats | null> {
//   const games = await getGameData();
//   if (!games) return null;

//   const gameIds = games.map(game => game.id);

//   const { data, error } = await supabase
//     .from('game_players')
//     .select(`
//       player_id,
//       games:games!inner (
//         date,
//         start_time
//       ),
//       players:players!inner (
//         name
//       )
//     `)
//     .in('game_id', gameIds)
//     .order('games.date', { ascending: false });

//   if (error || !data) {
//     console.error('Error fetching games:', error);
//     return null;
//   }

//   // Group by player and calculate consecutive games
//   const streaks = data.reduce((acc, curr) => {
//     const player = acc.get(curr.player_id) || { 
//       games: [] as Date[], 
//       currentStreak: 0,
//       name: curr.players[0].name 
//     };
//     player.games.push(new Date(`${curr.games[0].date} ${curr.games[0].start_time}`));
//     acc.set(curr.player_id, player);
//     return acc;
//   }, new Map<string, { games: Date[], name: string }>());
  
//   let maxStreak = { player_id: '', name: '', value: 0 };

//   streaks.forEach((player, playerId) => {
//     player.games.sort((a, b) => a.getTime() - b.getTime()); // Sort games by date
//     let currentStreak = 1;
//     for (let i = 1; i < player.games.length; i++) {
//       const daysDiff = Math.abs((player.games[i].getTime() - player.games[i - 1].getTime()) / (1000 * 60 * 60 * 24));
//       if (daysDiff <= 7) { // Consider games within 7 days as consecutive
//         currentStreak++;
//       } else {
//         break;
//       }
//     }
//     if (currentStreak > maxStreak.value) {
//       maxStreak = {
//         player_id: playerId,
//         name: player.name,
//         value: currentStreak
//       };
//     }
//   });

//   return maxStreak.player_id ? maxStreak : null;
// }

