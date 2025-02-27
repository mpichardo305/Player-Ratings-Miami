'use server';

import { createClient } from '@/app/utils/supabase/server';

export async function getInviteByToken(token: string) {
  const supabase = createClient();
  return await supabase
    .from('invites')
    .select(`token, player_id, used, group_id`)
    .eq('token', token)
    .single();
}

export async function createInviteRecord(token: string, groupId: string, playerId: string) {
  const supabase = createClient();
  return await supabase
    .from('invites')
    .insert([{ token, used: false, group_id: groupId, player_id: playerId }])
    .select()
    .single();
}

export async function updateInviteWithPlayer(inviteId: string, playerId: string) {
  const supabase = createClient();
  return await supabase
    .from('invites')
    .update({
      player_id: playerId,
    })
    .eq('id', inviteId);
}

export async function markInviteAsUsed(inviteId: string) {
  const supabase = createClient();
  return await supabase
    .from('invites')
    .update({ used: 'TRUE' })
    .eq('id', inviteId);
}

export async function createGroupMembership(playerId: string, groupId: string) {
  const supabase = createClient();
  return await supabase
    .from('group_memberships')
    .insert({
      player_id: playerId,
      group_id: groupId,
      status: 'pending'
    });
}