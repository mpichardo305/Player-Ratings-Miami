import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Hardcoded values as requested
    const playerId = '3e0a04fb-6e4b-41ee-899f-a7f1190b57f5';
    const groupId = '299af152-1d95-4ca2-84ba-43328284c38e';

    // Execute the query using Supabase
    const { data, error } = await supabase
      .from('games')
      .select('id:id, start_time, field_name')
      .in('group_id', [groupId])
      .filter('group_id', 'in', (
        supabase
          .from('group_admins')
          .select('group_id')
          .eq('player_id', playerId)
      ));

    if (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ error: 'Failed to fetch games' });
    }

    return res.status(200).json({ games: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
