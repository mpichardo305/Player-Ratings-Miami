'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'

interface Invite {
  id: string
  token: string
  email: string
  group_id: string
  is_admin: boolean
  used: boolean
  created_at: string
}

export default function InviteRegistration() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkInvite() {
      if (!token) {
        setError('Invalid invite link');
        router.push('/');
        return;
      }

      const result = await validateInvite({ token })
      
      if (result.error) {
        setError(result.error)
        router.push('/')
        return
      }

      setInvite(result.data)
    }

    checkInvite()
  }, [token, router])

  const handleSignupSuccess = async (newUserId: string) => {
    setUserId(newUserId)
  }

  const handleNameSubmit = async (name: string) => {
    if (!invite || !userId) return;

    try {
      // Start a transaction
      const { error: updateError } = await supabase
        .from('invites')
        .update({ used: true, used_by: userId })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Create player record with name
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          user_id: userId,
          email: invite.email,
          is_admin: invite.is_admin,
          name: name
        });

      if (playerError) throw playerError;

      // If admin, auto-approve group membership
      if (invite.is_admin) {
        const { error: membershipError } = await supabase
          .from('group_memberships')
          .insert({
            player_id: userId,
            group_id: invite.group_id,
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
            auto_approved: true
          });

        if (membershipError) throw membershipError;
      }

      // Use replace instead of push and add a fallback
      try {
        await router.replace('/');
      } catch (e) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup');
    }
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {invite ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6 pt-20">
          <h2 className="text-2xl font-semibold text-center">Complete Your Registration</h2>
          <p className="text-gray-400 text-center mt-2">You've been invited to join the group.</p>
          {!userId ? (
            <PhoneAuth onSignupSuccess={handleSignupSuccess} inviteEmail={invite.email} />
          ) : (
            <PlayerNameForm onSubmit={handleNameSubmit} />
          )}
        </div>
      ) : (
        <div>Validating invite...</div>
      )}
    </div>
  )
}