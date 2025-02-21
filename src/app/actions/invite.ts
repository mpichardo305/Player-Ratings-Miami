'use server'

import { supabase } from '@/app/utils/supabaseClient'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

// Add this function at the top of the file after the imports
function genPlayerId(): string {
  // Generate a shorter, more readable ID
  // Format: P-XXXX where X is alphanumeric
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLength = 4;
  let result = 'P-';
  
  for (let i = 0; i < idLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Type for your action parameters
interface ValidateInviteParams {
  token: string
}

export async function validateInvite({ token }: ValidateInviteParams) {
  try {
    // Select all needed fields from invites table
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select(`
        token,
        player_id,
        used,
        group_id
      `)
      .eq('token', token)
      .single()

    // Log for debugging
    console.log('Invite validation result:', { inviteData, inviteError })

    // Handle database errors or no data found
    if (inviteError || !inviteData) {
      console.error('Invalid invite error:', inviteError)
      return { error: 'Invalid or expired invite' }
    }

    // Check if invite has been used
    if (inviteData.used) {
      console.log('Invite already used:', inviteData)
      return { error: 'This invite has already been used' }
    }

    // Return successful validation with all needed data
    return { 
      data: {
        token: inviteData.token,
        player_id: inviteData.player_id,
        group_id: inviteData.group_id,
        used: inviteData.used
      }
    }

  } catch (error) {
    console.error('Validation error:', error)
    return { error: 'Failed to validate invite' }
  }
}

export async function createInvite(groupId: string) {
  const token = uuidv4();
  const playerId = genPlayerId(); // Generate the player ID

  try {
    console.log('Creating invite with:', {
      token,
      groupId,
      playerId
    });

    const { data, error } = await supabase
      .from('invites')
      .insert([{ 
        token, 
        used: false, 
        group_id: groupId, 
        player_id: playerId 
      }]);

    if (error) {
      console.error('Error inserting invite:', error);
      return { error: 'Failed to create invite' };
    }

    return { data: { token, playerId } };
  } catch (error) {
    console.error('Error in createInvite function:', error);
    return { error: 'Failed to create invite' };
  }
}