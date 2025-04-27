'use server'

import { createClient } from '@/app/utils/supabase/server'

interface PlayerMembershipResult {
  isMember: boolean;
  playerId: string | null;
  status?: string;
}

export async function checkPlayerMembership(phoneNumber: string, groupId: string): Promise<PlayerMembershipResult> {
  const supabase = createClient()
  
  // Normalize the phone number by removing '+' if present
  const normalizedPhone = phoneNumber.replace(/^\+/, '');
  
  console.log('Checking membership - Phone:', normalizedPhone, 'Group:', groupId); 
  
  // First check if player exists with this phone number
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('phone', normalizedPhone)
    .single()

  console.log('Player query result:', { player, playerError }); // Debug log

  if (playerError || !player) {
    console.log('No player found with this phone number');
    return { isMember: false, playerId: null }
  }

  // Then check if player is member of the specified group with approved status
  const { data: membership, error: membershipError } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('player_id', player.id)
    .eq('group_id', groupId)
    .eq('status', 'approved')
    .single()

  console.log('Membership query details:', {
    membership,
    membershipError,
    playerId: player.id,
    sql: `SELECT * FROM group_memberships WHERE player_id = '${player.id}' AND group_id = '${groupId}' AND status = 'approved'`
  });

  const result = {
    isMember: !membershipError && membership !== null,
    playerId: player.id,
    status: membership?.status || 'not found'
  };

  console.log('=== Final Membership Result ===', result);

  return result;
}

export async function checkPlayerMembershipById(playerId: string, groupId: string): Promise<PlayerMembershipResult> {
  const supabase = createClient()
  
  console.log('Checking membership by ID - Player:', playerId, 'Group:', groupId)

  // Check if player is member of the specified group with approved status
  const { data: membership, error: membershipError } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('player_id', playerId)
    .eq('group_id', groupId)
    .eq('status', 'approved')
    .single()

  console.log('Membership query details:', {
    membership,
    membershipError,
    playerId,
    sql: `SELECT * FROM group_memberships WHERE player_id = '${playerId}' AND group_id = '${groupId}' AND status = 'approved'`
  })

  const result = {
    isMember: !membershipError && membership !== null,
    playerId,
    status: membership?.status || 'not found'
  }

  console.log('=== Final Membership Result ===', result)

  return result
}
