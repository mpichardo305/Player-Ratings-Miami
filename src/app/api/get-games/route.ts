import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    // Hardcoded values as requested
    const playerId = '3e0a04fb-6e4b-41ee-899f-a7f1190b57f5';
    const groupId = '299af152-1d95-4ca2-84ba-43328284c38e';

    // First get the groups this player can access
    const { data: adminGroups, error: adminError } = await supabase
      .from('group_admins')
      .select('group_id')
      .eq('player_id', playerId);

    if (adminError) {
      console.error('Error fetching admin groups:', adminError);
      return NextResponse.json({ error: 'Failed to fetch admin groups' }, { status: 500 });
    }

    // Extract group IDs from the results
    const accessibleGroupIds = adminGroups.map(group => group.group_id);
    
    // Add the specific group ID if not already included
    if (!accessibleGroupIds.includes(groupId)) {
      accessibleGroupIds.push(groupId);
    }

    // Now fetch games for these groups
    const { data, error } = await supabase
      .from('games')
      .select('id, start_time, date, field_name, group_id')
      .in('group_id', accessibleGroupIds)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
