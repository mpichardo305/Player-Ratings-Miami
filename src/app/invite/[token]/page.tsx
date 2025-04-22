'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'
import { createInitialPlayer, getPlayerByPhone, updatePlayerName } from '@/app/db/playerQueries'
import { createGroupMembership, markInviteAsUsed, updateInviteWithPlayer } from '@/app/db/inviteQueries'
import { usePhoneNumber } from '@/app/hooks/usePhoneNumber'
import { Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/toaster"
import ReturningPlayerNewGroup from '@/app/components/ReturningPlayerNewGroup';

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
  const [nextPage, setNextPage] = useState<boolean>(false);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState<string>('');
  const { toast } = useToast()

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
      }, 3000); // 3 seconds delay before redirect
      return () => clearTimeout(timer);
    }
  }, [inviteStatus, router]);
  useEffect(() => {
    if (!nextPage) {
      toast({
        title: "Complete Your Registration",
        description: "You've been invited to join the group.",
        duration: 3000,
      })
    }
  }, [nextPage, toast])

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
        setNextPage(true);
        return;
      }

    // 1) see if this phone is already in players
    const { data: existing, error: lookupErr } = await getPlayerByPhone(sanitizedPhone)
    if (lookupErr) throw lookupErr

    let actualPlayerId = existing?.id
    // 2) if no existing, create new
    if (!actualPlayerId) {
      const { data: newPlayer, error: newErr } = await createInitialPlayer(newUserId, sanitizedPhone)
      if (newErr) throw newErr
      actualPlayerId = newPlayer.id
      setNextPage(true);
    }
    // 3) link invite → player
    if (actualPlayerId) {
    await updateInviteWithPlayer(inviteData.id, actualPlayerId)
    setIsReturning(true);
    setNextPage(true);
    }
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
    const handleReturningConfirm = async () => {
    if (!invite) return
    try {
      await markInviteAsUsed(invite.id)
      await createGroupMembership(invite.player_id, invite.group_id)
      await router.replace('/pending-approval')
    } catch (err) {
      console.error(err)
      setError('Failed to add you to the new group')
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6">
        <div className="p-4 text-center">
          <p className="text-xl mb-2">{error}</p>
          <Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">
        Redirecting to home page...
      </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">
    Validating invite....
  </span></>
  }

  console.log('Invite:', invite);
  return (
    <div className="max-w-md mx-auto p-6">
        {!nextPage ? (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6 pt-20">
            <PhoneAuth onVerificationSuccess={handleSignupSuccess}/>
          </div>
       ) : isReturning ? (
        <ReturningPlayerNewGroup onConfirm={handleReturningConfirm} />
      ) : (
        <PlayerNameForm onSubmit={handleNameSubmit} />
      )}
    </div>
  )
}