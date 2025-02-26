'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'
import { set } from 'lodash'

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

    const result = await validateInvite({ token })
    console.log('Result from validateInvite:', result);
    
    if (result.error) {
      setError(result.error)
      router.push('/')
      return
    }

    console.log('Invite data:', result.data);
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
      // Get current user from session
      const { data: { session } } = await supabase.auth.getSession();
      const newUserId = session?.user?.id;

      if (!newUserId) {
        throw new Error('No user ID found in session');
      }

      // 1. Set userId in state
      setUserId(newUserId);
      console.log('Set userId to:', newUserId);

    // 2. Fetch invite data if not already available
    let currentInvite = invite;
    if (!currentInvite) {
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Failed to fetch invite data');
      }
      currentInvite = inviteData;
      setInvite(inviteData);
    } 
      // 3. Create initial player record 
      // need to get the phone from phone auth
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          status: 'pending',
          phone: null,
          userId: newUserId
        })
        .select()
        .single();

      if (playerError) {
        console.error('Player creation error:', playerError);
        throw playerError;
      }

      // 4. Update invite with player_id
      if (!currentInvite) throw new Error('No invite data available');
      
      const { error: updateError } = await supabase
        .from('invites')
        .update({
          player_id: playerData.id,
        })
        .eq('id', currentInvite.id);

      if (updateError) {
        console.error('Invite update error:', updateError);
        throw updateError;
      }

      console.log('Updated invite, full state:', { userId: newUserId, playerData });
      setnextPage(true);
    } catch (error) {
      console.error('Error in handleSignupSuccess:', error);
      setError('Failed to complete signup');
    }
  };

  const handleNameSubmit = async (name: string) => {
    if (!invite || !userId) return;
    try {
      // Get the current invite data
      const { data: currentInvite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .single();

      if (inviteError || !currentInvite) {
        throw new Error('Failed to fetch invite data');
      }

      // 1. Update existing player with name
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .update({ 
          name: name,
          status: 'approved'
        })
        .eq('id', currentInvite.player_id)
        .select()
        .single();

      if (playerError) throw playerError;
      console.log('Updated player:', playerData);

      // 2. Mark invite as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({ used: 'TRUE' })
        .eq('id', currentInvite.id);

      console.log('Marked invite as used:', currentInvite.id);
      if (updateError) throw updateError;

      // 3. Create group membership
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          player_id: currentInvite.player_id,
          group_id: currentInvite.group_id,
          status: 'pending'
        });

      if (membershipError) throw membershipError;

      console.log('Registration complete, redirecting...');
      await router.replace('/');
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup');
    }
  }

  console.log('Render state:', { userId, invite, error });

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