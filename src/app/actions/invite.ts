'use server'

import { supabase } from '@/app/utils/supabaseClient'
import { revalidatePath } from 'next/cache'

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