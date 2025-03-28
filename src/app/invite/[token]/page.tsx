'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'
import { createInitialPlayer, updatePlayerName } from '@/app/db/playerQueries'
import { createGroupMembership, markInviteAsUsed, updateInviteWithPlayer } from '@/app/db/inviteQueries'
import { usePhoneNumber } from '@/app/hooks/usePhoneNumber'

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

export default function InviteRegistration() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [nextPage, setnextPage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState<string>('');

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
    
    if (result.status !== 'valid') {
      // Handle different status types
      switch (result.status) {
        case 'already_used':
          setError('Sorry, this invite link has already been used.');
          break;
        case 'invalid':
        case 'error':
        default:
          setError(result.message || 'Invalid or expired invite link');
          break;
      }
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
      return;
    }
    
    setInvite(result.data as Invite);
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

  useEffect(() => {
    if (inviteStatus === 'invalid' || inviteStatus === 'already_used') {
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000); // 2 seconds delay before redirect
      return () => clearTimeout(timer);
    }
  }, [inviteStatus, router]);

  const { phoneNumber } = usePhoneNumber();
  const sanitizedPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';

  const handleSignupSuccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newUserId = session?.user?.id;
      if (!newUserId) {
        throw new Error('No user ID found in session');
      }

      setUserId(newUserId);

      // Use validateInvite from server action with new status field
      const result = await validateInvite(token);
      
      if (result.status !== 'valid') {
        // Handle different error conditions based on status
        if (result.status === 'already_used') {
          setError('This invite has already been used');
          setTimeout(() => router.push('/logout'), 2000);
        } else {
          setError(result.message || 'Invalid invite link');
          setTimeout(() => router.push('/logout'), 2000);
        }
        return;
      }
      
      const inviteData = result.data as Invite;
      setInvite(inviteData);

      // Check if invite already has a player_id before creating a new one
      if (inviteData.player_id) {
        console.log('Invite already has a player assigned, skipping player creation');
        setnextPage(true);
        return;
      }

      // Create player record with proper user association
      const { data: playerData, error: playerError } = await createInitialPlayer(newUserId, sanitizedPhone);
      if (playerError) throw playerError;

      await updateInviteWithPlayer(inviteData.id, playerData.id);
      setnextPage(true);
    } catch (error) {
      console.error('Error in handleSignupSuccess:', error);
      setError('Failed to complete signup');
      setTimeout(() => router.push('/logout'), 2000);
    }
  };

  const handleNameSubmit = async (name: string) => {
    if (!invite || !userId) return;
    try {
      // Use server actions instead of direct queries
      if (!phoneNumber) throw new Error('Phone number is required');
      await updatePlayerName(invite.player_id, name, userId, sanitizedPhone);
      await markInviteAsUsed(invite.id);
      await createGroupMembership(invite.player_id, invite.group_id);

      console.log('Registration complete, redirecting to pending approval...');
      await router.replace('/pending-approval');
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup');
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6">
        <div className="p-4 text-center">
          <p className="text-xl mb-2">{error}</p>
          <p className="text-sm text-gray-400">Redirecting to home page...</p>
        </div>
      </div>
    );
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