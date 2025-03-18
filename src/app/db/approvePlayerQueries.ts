'use server';

import { createClient } from '@/app/utils/supabase/server';

export async function updateGroupMembership(playerId: string, groupId: string) {
  const supabase = createClient();
  return await supabase
    .from('group_memberships')
    .update({ status: 'approved' })
    .eq('player_id', playerId)
    .eq('group_id', groupId)
    .eq("status", "pending");
}

export async function updateInvitesTableViaPlayerId(playerId: string) {
  const supabase = createClient();
  return await supabase
    .from('invites')
    .update({ used: true })
    .eq('player_id', playerId)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);
}

export async function updatePlayerStatusAndPhone(playerId: string, phoneNumber: string) {
  const supabase = createClient();
  return await supabase
    .from('players')
    .update({ 
      status: 'active',
      phone: phoneNumber 
    })
    .eq('id', playerId);
}