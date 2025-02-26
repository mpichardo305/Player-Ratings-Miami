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
  player_id: string  // Add this property
}

export default function InviteRegistration() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  // const [playerId, setPlayerId] = useState<string>('');
  const [nextPage, setnextPage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


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
// need to do another useeffect to get the player id from the token? 
// need to console log the result of the validateInvite function to see what it returns

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

  const handleSignupSuccess = async (newUserId: string) => {
    console.log('Signup success starting with userId:', newUserId);
    try {
      // 1. Set userId in state
      setUserId(newUserId); // Check if this is actually updating the state
      console.log('Set userId to:', newUserId);
      
      // 2. Create initial player record with phone
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          phone: newUserId,
          status: 'pending'
        })
        .select()
        .single();

      if (playerError) {
        console.error('Player creation error:', playerError);
        throw playerError;
      }

      // Log successful player creation
      console.log('Created player record:', playerData);

      // 3. Update invite with player_id immediately after player creation
      const { error: updateError } = await supabase
        .from('invites')
        .update({
          player_id: playerData.id
        })
        .eq('id', invite?.id);

      if (updateError) {
        console.error('Invite update error:', updateError);
        throw updateError;
      }

      // Log successful invite update
      console.log('Updated invite, full state:', { userId: newUserId, playerData });
    } catch (error) {
      console.error('Error in handleSignupSuccess:', error);
      setError('Failed to complete signup');
    }
    setnextPage(true);
  }

  const handleNameSubmit = async (name: string) => {
    if (!invite || !userId) return;
    try {
      // 1. Update existing player with name
      console.log('Updating player with name:', name);
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .update({ 
          name: name,
          status: 'active'
        })
        .eq('player_id', invite.player_id)
        .select()
        .single();

      if (playerError) throw playerError;
      console.log('Updated:', playerData);


      // 2. Mark invite as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({ used: true })
        .eq('id', invite.id);

      console.log('Marked invite as used:', invite.id);
      if (updateError) throw updateError;

      // 3. Create group membership
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          player_id: invite.player_id,
          group_id: invite.group_id,
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
            <PhoneAuth onSignupSuccess={handleSignupSuccess} />
          </div>
        ) : (
          <PlayerNameForm onSubmit={handleNameSubmit} />
        )}
    </div>
  )
}