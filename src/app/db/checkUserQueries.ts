'use server'

import { createClient } from '@/app/utils/supabase/server'

export async function checkPlayerMembership(phoneNumber: string, groupId: string) {
  const supabase = createClient()
  
  // Normalize the phone number by removing '+' if present
  const normalizedPhone = phoneNumber.replace(/^\+/, '');
  
  console.log('Checking for phone:', normalizedPhone); // Debug log
  
  // First check if player exists with this phone number
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('phone', normalizedPhone)
    .single()

  console.log('Player query result:', { player, playerError }); // Debug log

  if (playerError || !player) {
    return { isMember: false, playerId: null }
  }

  // Then check if player is member of the specified group
// Check membership
const { data: membership, error: membershipError } = await supabase
.from('group_memberships')
.select('*')
.eq('player_id', player.id)
.eq('group_id', groupId)
.single()

console.log('Membership query details:', {
membership,
membershipError,
sql: `SELECT * FROM group_memberships WHERE player_id = '${player.id}' AND group_id = '${groupId}'`
});

const result = {
isMember: !membershipError && membership !== null,
playerId: player.id
};

console.log('=== Final Result ===', result);

return result;
}
