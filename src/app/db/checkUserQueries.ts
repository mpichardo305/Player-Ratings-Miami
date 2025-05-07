'use server'

import { createClient } from '@/app/utils/supabase/server'

interface PlayerMembershipResult {
  isMember: boolean;
  playerId: string | null;
  status?: string;
}

export async function checkPlayerMembership(phoneNumber: string, groupId: string): Promise<PlayerMembershipResult> {
  const supabase = createClient()
  
  const normalizedPhone = phoneNumber.replace(/^\+/, '')
  
  console.log('Checking membership - Phone:', normalizedPhone, 'Group:', groupId)
  
  // Get all players with this phone number
  const { data: players, error: playerError } = await supabase
    .from('players')
    .select('id, status')
    .eq('phone', normalizedPhone)
    .order('status', { ascending: true }) // active before pending
  
  console.log('Players query result:', { players, playerError })

  if (playerError || !players?.length) {
    console.log('No players found with this phone number')
    return { isMember: false, playerId: null }
  }

  // Check memberships for all players
  for (const player of players) {
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('player_id', player.id)
      .eq('group_id', groupId)
      .eq('status', 'approved')
      .maybeSingle()

    console.log('Checking membership for player:', { playerId: player.id, membership, membershipError })

    if (membership) {
      console.log('=== Found Approved Membership ===', { playerId: player.id, status: membership.status })
      return { isMember: true, playerId: player.id, status: membership.status }
    }
  }

  // fallback: any active player record counts as membership
  const active = players.find((p) => p.status === 'active')
  if (active) {
    console.log('=== Fallback to active player record ===', active.id)
    return { isMember: true, playerId: active.id, status: 'active' }
  }

  console.log('=== No Approved Membership Found ===', { playerId: players[0].id })
  return { isMember: false, playerId: players[0].id, status: 'not found' }
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
