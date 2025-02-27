'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'
import { createInitialPlayer, updatePlayerName } from '@/app/db/playerQueries'
import { createGroupMembership, markInviteAsUsed, updateInviteWithPlayer } from '@/app/db/inviteQueries'
import { PhoneNumber } from 'react-phone-number-input'
interface Invite {
  id: string
  token: string
  email: string
  group_id: string
  is_admin: boolean
  used: boolean
  created_at: string
  player_id: string
  user_id: string;
}

const getPhoneNumberFromSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.user_metadata?.phone_number;
};

export default function InviteRegistration() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [nextPage, setnextPage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session when component mounts
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        // If user is already authenticated, trigger signup success flow
        await handleSignupSuccess();
      }
    };
    
    checkSession();
  }, []); // Run once on mount

  async function checkInvite() {
    console.log('Checking invite with token:', token);
    if (!token) {
      setError('Invalid invite link');
      router.push('/');
      return;
    }
    const result = await validateInvite(token)
    
    if (result.error) {
      setError(result.error)
      router.push('/')
      return
    }
    setInvite(result.data as Invite)
    setIsLoading(false);
  }

  useEffect(() => {
    checkInvite();
    
  }, [token, router])

  useEffect(() => {
    console.log('Debug - State Changes:', {
      token,
      userId,
      invite: invite ? {
        id: invite.id,
        player_id: invite.player_id,
        used: invite.used,
        group_id: invite.group_id
      } : null,
      isLoading
    });
  }, [token, userId, invite, isLoading]);

  const handleSignupSuccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newUserId = session?.user?.id;
      const phoneNumber = await getPhoneNumberFromSession();

      if (!newUserId) {
        throw new Error('No user ID found in session');
      }

      setUserId(newUserId);

      // Use validateInvite from server action
            const result = await validateInvite(token);
            if (result.error || !result.data) {
              throw new Error('Failed to fetch invite data');
            }
            const inviteData = result.data as Invite;
            setInvite(inviteData);

      // Use server actions instead of direct Supabase queries
      const { data: playerData, error: playerError } = await createInitialPlayer(newUserId, phoneNumber);
      if (playerError) throw playerError;

      await updateInviteWithPlayer(inviteData.id, playerData.id);

      setnextPage(true);
    } catch (error) {
      console.error('Error in handleSignupSuccess:', error);
      setError('Failed to complete signup');
    }
  };

  const handleNameSubmit = async (name: string) => {
    const phoneNumber = await getPhoneNumberFromSession();
    if (!invite || !userId) return;
    try {
      // Use server actions instead of direct queries
      await updatePlayerName(invite.player_id, name, userId, phoneNumber);
      await markInviteAsUsed(invite.id);
      await createGroupMembership(invite.player_id, invite.group_id);

      console.log('Registration complete, redirecting...');
      await router.replace('/');
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup');
    }
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  if (isLoading) {
    return <div>Validating invite... </div>
  }

  console.log('Invite:', invite);
  return (
    <div className="max-w-md mx-auto p-6">
        {!nextPage ? (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6 pt-20">
            <h2 className="text-2xl font-semibold text-center">Complete Your Registration</h2>
            <p className="text-gray-400 text-center mt-2">You've been invited to join the group.</p>
            <PhoneAuth onVerificationSuccess={handleSignupSuccess}/>
          </div>
        ) : (
          <PlayerNameForm onSubmit={handleNameSubmit} />
        )}
    </div>
  )
}