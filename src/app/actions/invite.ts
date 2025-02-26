'use server'

import { supabase } from '@/app/utils/supabaseClient'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

// Type for your action parameters
interface ValidateInviteParams {
  token: string
}

interface PlayerIdPair {
  uuid: string;
  readableId: string;
}

function genPlayerId(): PlayerIdPair {
  // Generate UUID for database
  const uuid = uuidv4();
  
  // Generate readable reference (for display purposes)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLength = 4;
  let readableId = 'P-';
  
  for (let i = 0; i < idLength; i++) {
    readableId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return { uuid, readableId };
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
  const { uuid: playerId } = genPlayerId();

  try {
    console.log('Creating player and invite with:', {
      token,
      groupId,
      playerId
    });

    // Start a Supabase transaction
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert([{
        id: playerId,
        status: 'pending',
      }])
      .select()
      .single();

    if (playerError) throw playerError;

    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .insert([{ 
        token, 
        used: false, 
        group_id: groupId, 
        player_id: playerData.id
      }])
      .select()
      .single();

    if (inviteError) throw inviteError;

    revalidatePath('/'); // Revalidate the players page cache

    return { 
      data: { 
        token,
        playerId: playerData.id
      } 
    };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to create invite' };
  }
}