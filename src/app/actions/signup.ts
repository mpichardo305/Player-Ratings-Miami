'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient('your-supabase-url', 'your-supabase-key')

export async function handleInviteSignup({ userId, inviteId, email, isAdmin, groupId }: {
  userId: string
  inviteId: string
  email: string
  isAdmin: boolean
  groupId: string
}) {
  try {
    // Start a transaction
    const { error: updateError } = await supabase
      .from('invites')
      .update({ used: true, used_by: userId })
      .eq('id', inviteId)

    if (updateError) throw updateError

    // Create player record
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        user_id: userId,
        email: email,
        is_admin: isAdmin
      })

    if (playerError) throw playerError

    // If admin, auto-approve group membership
    if (isAdmin) {
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          player_id: userId,
          group_id: groupId,
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          auto_approved: true 
        })

      if (membershipError) throw membershipError
    }

    return { success: true }
  } catch (error) {
    return { error: 'Failed to complete signup' }
  }
}