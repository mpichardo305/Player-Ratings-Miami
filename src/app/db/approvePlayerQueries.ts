'use server';

import { createClient } from '@/app/utils/supabase/server';

export async function updateGroupMembership(playerId: string, groupId: string) {
  console.log(`[SERVER] updateGroupMembership called with playerId: ${playerId}, groupId: ${groupId}`);
  // find a way to also add playerName to the group_memberships table
  const supabase = createClient();
  try {
    const result = await supabase
      .from('group_memberships')
      .update({ status: 'approved' })
      .eq('player_id', playerId)
      .eq('group_id', groupId)
      .eq("status", "pending");
    
    console.log(`[SERVER] updateGroupMembership completed successfully`, result);
    return result;
  } catch (error) {
    console.error(`[SERVER] updateGroupMembership failed:`, error);
    throw error;
  }
}

export async function updateInvitesTableViaPlayerId(playerId: string) {
  console.log(`[SERVER] updateInvitesTableViaPlayerId called with playerId: ${playerId}`);
  const supabase = createClient();
  try {
    const result = await supabase
      .from('invites')
      .update({ used: true })
      .eq('player_id', playerId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log(`[SERVER] updateInvitesTableViaPlayerId completed successfully`, result);
    return result;
  } catch (error) {
    console.error(`[SERVER] updateInvitesTableViaPlayerId failed:`, error);
    throw error;
  }
}

export async function updatePlayerStatusAndPhone(playerId: string, phoneNumber: string) {
  console.log(`[SERVER] updatePlayerStatusAndPhone called with playerId: ${playerId}, phoneNumber: ${phoneNumber}`);
  const supabase = createClient();
  try {
    const result = await supabase
      .from('players')
      .update({ 
        status: 'active',
        phone: phoneNumber 
      })
      .eq('id', playerId);
    
    console.log(`[SERVER] updatePlayerStatusAndPhone completed successfully`, result);
    return result;
  } catch (error) {
    console.error(`[SERVER] updatePlayerStatusAndPhone failed:`, error);
    throw error;
  }
}