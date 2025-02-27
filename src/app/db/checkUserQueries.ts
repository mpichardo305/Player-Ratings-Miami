'use server'

import { createClient } from '@/app/utils/supabase/server'

export async function checkPlayerMembership(phoneNumber: string, groupId: string) {
  const supabase = createClient()
  
  // First check if player exists with this phone number
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('phone', phoneNumber)
    .single()

  if (playerError || !player) {
    return { isMember: false, playerId: null }
  }

  // Then check if player is member of the specified group
  const { data: membership, error: membershipError } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('player_id', player.id)
    .eq('group_id', groupId)
    .single()

  return {
    isMember: !membershipError && membership !== null,
    playerId: player.id
  }
}