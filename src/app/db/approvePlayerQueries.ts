'use server';

import { createClient } from '@/app/utils/supabase/server';

/**
 * Normalize a phone number to ensure consistent format
 * @param phoneNumber The phone number to normalize
 * @returns Normalized phone number (digits only)
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const normalized = phoneNumber.replace(/\D/g, '');
  console.log(`[SERVER] Normalized phone number from ${phoneNumber} to ${normalized}`);
  return normalized;
}

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
  console.log(`[SERVER] updatePlayerStatusAndPhone called with playerId: ${playerId}, phoneNumber: ${phoneNumber || 'empty'}`);
  const supabase = createClient();
  
  try {
    // Debug: Check player record before update
    const { data: beforePlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    console.log(`[SERVER] Current phone number: ${beforePlayer?.phone || 'not set'}`);
      
    console.log(`[SERVER] Player before update:`, beforePlayer);
    
    // Create update payload based on whether phone is provided
    const updatePayload: { status: string; phone?: string } = { 
      status: 'active'
    };
    
    // Only include phone if it's provided and not empty
    if (phoneNumber && phoneNumber.trim() !== '') {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      updatePayload.phone = normalizedPhone;
      console.log(`[SERVER] Updating player with phone: ${normalizedPhone}`);
    } else {
      console.log(`[SERVER] No phone number provided, only updating status`);
    }
    
    const result = await supabase
      .from('players')
      .update(updatePayload)
      .eq('id', playerId);
    
    if (result.error) {
      console.error(`[SERVER] Error updating player:`, result.error);
      throw new Error(`Failed to update player: ${result.error.message}`);
    }
    
    // Debug: Get the updated player record to verify changes
    const { data: updatedPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
      
    console.log(`[SERVER] Player after update:`, updatedPlayer);
    
    console.log(`[SERVER] updatePlayerStatusAndPhone completed successfully`, result);
    return result;
  } catch (error) {
    console.error(`[SERVER] updatePlayerStatusAndPhone failed:`, error);
    throw error;
  }
}

/**
 * Combined function to approve a player, update their phone number, and handle all related updates
 * @param playerId The player's ID
 * @param groupId The group ID
 * @param phoneNumber The player's phone number
 */
export async function approvePlayer(playerId: string, groupId: string, phoneNumber: string) {
  console.log(`[SERVER] approvePlayer called with playerId: ${playerId}, groupId: ${groupId}, phoneNumber: ${phoneNumber || 'empty'}`);
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
    
    // Create update payload based on whether phone is provided
    const updatePayload: { status: string; phone?: string } = { 
      status: 'active'
    };
    
    // Only include phone if it's provided and not empty
    if (phoneNumber && phoneNumber.trim() !== '') {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      updatePayload.phone = normalizedPhone;
      console.log(`[SERVER] Updating player with phone: ${normalizedPhone}`);
    } else {
      console.log(`[SERVER] No phone number provided, only updating status`);
    }
    
    // Update player status and phone number if provided
    const playerUpdateResult = await supabase
      .from('players')
      .update(updatePayload)
      .eq('id', playerId);
    
    if (playerUpdateResult.error) {
      throw new Error(`Failed to update player: ${playerUpdateResult.error.message}`);
    }
    
    // Debug: Check player record before update
    const { data: beforePlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
      
    console.log(`[SERVER] Player before update:`, beforePlayer);
    
    // Debug: Get the updated player record to verify changes
    const { data: updatedPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
      
    console.log(`[SERVER] Player after update:`, updatedPlayer);
    
    // Update the group membership
    const membershipResult = await supabase
      .from('group_memberships')
      .update({ 
        status: 'approved',
        name: playerName
      })
      .eq('player_id', playerId)
      .eq('group_id', groupId)
      .eq("status", "pending");
    
    if (membershipResult.error) {
      throw new Error(`Failed to update group membership: ${membershipResult.error.message}`);
    }
    
    // Update the invites table
    const inviteResult = await supabase
      .from('invites')
      .update({ used: true })
      .eq('player_id', playerId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log(`[SERVER] approvePlayer completed successfully`);
    
    return {
      playerUpdate: playerUpdateResult,
      membershipUpdate: membershipResult,
      inviteUpdate: inviteResult
    };
  } catch (error) {
    console.error(`[SERVER] approvePlayer failed:`, error);
    throw error;
  }
}