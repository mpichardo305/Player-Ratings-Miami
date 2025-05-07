'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getInviteByToken, createInviteRecord } from '@/app/db/inviteQueries';
import { createInitialPlayer } from '@/app/db/playerQueries';

// Generate Player ID
interface PlayerIdPair {
  uuid: string;
  readableId: string;
}

export async function genPlayerId(): Promise<PlayerIdPair> {
  const uuid = uuidv4();
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLength = 4;
  let readableId = 'P-';
  
  for (let i = 0; i < idLength; i++) {
    readableId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return { uuid, readableId };
}

// Validate Invite Token
export async function validateInvite(token: string) {
  try {
    const { data, error } = await getInviteByToken(token);
    
    if (error || !data) return { status: 'invalid', message: 'Invalid or expired invite' };
    if (data.used) return { status: 'already_used', data, message: 'This invite has already been used' };
    
    return { status: 'valid', data };
  } catch (error) {
    console.error('Validation error:', error);
    return { status: 'error', message: 'Failed to validate invite' };
  }
}

// Create Invite with Player
export async function createInvite(groupId: string) {
  const token = uuidv4();
  const { uuid: playerId } = await genPlayerId();

  try {
    console.log('Creating player and invite with:', { token, groupId, playerId });

    // Insert Player Record
    const { data: playerData, error: playerError } = await createInitialPlayer(playerId, null);
    if (playerError) throw playerError;

    // Insert Invite Record
    const { data: inviteData, error: inviteError } = await createInviteRecord(token, groupId, playerData.id);
    if (inviteError) throw inviteError;

    revalidatePath('/'); // Refresh cache

    return { data: { token, playerId: playerData.id } };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to create invite' };
  }
}