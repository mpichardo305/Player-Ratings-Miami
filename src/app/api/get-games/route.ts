import { supabase } from '@/app/utils/supabaseClient'

import { NextResponse } from 'next/server';
import { estDateTimeToUtc } from '@/app/utils/dateUtils';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const groupId = searchParams.get('groupId'); 

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // First get all groups this player can access
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_memberships')
      .select('group_id')
      .eq('player_id', playerId);

    if (memberError) {
      console.error('Error fetching member groups:', memberError);
      return NextResponse.json({ error: 'Failed to fetch member groups' }, { status: 500 });
    }

    const { data: adminGroups, error: adminError } = await supabase
      .from('group_admins')
      .select('group_id')
      .eq('player_id', playerId);

    if (adminError) {
      console.error('Error fetching admin groups:', adminError);
      return NextResponse.json({ error: 'Failed to fetch admin groups' }, { status: 500 });
    }

        // Extract group IDs from both admin and member groups
        const accessibleGroupIds = [
          ...adminGroups.map(group => group.group_id),
          ...memberGroups.map(group => group.group_id)
        ];

            // Remove duplicates using Set
      const uniqueGroupIds = [...new Set(accessibleGroupIds)];
    
      // Build the games fetch query conditionally
      let gamesQuery = supabase
        .from('games')
        .select('id, start_time, date, field_name, group_id');

      if (groupId) {
        // only this one group
        gamesQuery = gamesQuery.eq('group_id', groupId);
      } else {
        // all groups the player can access
        gamesQuery = gamesQuery.in('group_id', uniqueGroupIds);
      }


    // Fetch ALL games for those groups
    const { data: games, error } = await gamesQuery

    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    const nowUtc = new Date();
    const upcomingGames: typeof games = [];
    const previousGames: typeof games = [];

    games.forEach((g) => {
      const gameUtc = estDateTimeToUtc(g.date, g.start_time);
      if (gameUtc > nowUtc) upcomingGames.push(g);
      else previousGames.push(g);
    });

    // Optional: sort your lists
    const sortAsc = (a: any, b: any) =>
      estDateTimeToUtc(a.date, a.start_time).getTime() -
      estDateTimeToUtc(b.date, b.start_time).getTime();
    upcomingGames.sort(sortAsc);
    previousGames.sort((a, b) => sortAsc(b, a));

    return NextResponse.json({ upcomingGames, previousGames });
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
