'use server'

import { supabase } from '@/app/utils/supabaseClient'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

// Type for your action parameters
interface ValidateInviteParams {
  token: string
}

export async function validateInvite({ token }: ValidateInviteParams) {
  try {
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !inviteData) {
      return { error: 'Invalid or expired invite' }
    }

    if (inviteData.used) {
      return { error: 'This invite has already been used' }
    }

    return { data: inviteData }
  } catch (error) {
    return { error: 'Failed to validate invite' }
  }
}

export async function createInvite(groupId: string) {
  const token = uuidv4()
  try {
    console.log('Inserting invite with token:', token, 'and groupId:', groupId)
    const { data, error } = await supabase
      .from('invites')
      .insert([{ token, used: false, group_id: groupId }])

    if (error) {
      console.error('Error inserting invite:', error)
      return { error: 'Failed to create invite' }
    }

    return { data: { token } }
  } catch (error) {
    console.error('Error in createInvite function:', error)
    return { error: 'Failed to create invite' }
  }
}