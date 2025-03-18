'use server';

import { createClient } from '@/app/utils/supabase/server';

export async function updateGroupMembership(playerId: string, groupId: string) {
  console.log(`[SERVER] updateGroupMembership called with playerId: ${playerId}, groupId: ${groupId}`);
  const supabase = createClient();
  
  try {
    // First fetch the player's name from the players table
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('name')
      .eq('id', playerId)
      .single();
    
    if (playerError || !playerData) {
      console.error(`[SERVER] Failed to fetch player name:`, playerError);
      throw new Error(`Failed to fetch player name: ${playerError?.message || 'Player not found'}`);
    }
    
    const playerName = playerData.name;
    console.log(`[SERVER] Found player name: ${playerName}`);
    
    // Then update the group_membership with both status and player_name
    const result = await supabase
      .from('group_memberships')
      .update({ 
        status: 'approved',
        name: playerName
      })
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