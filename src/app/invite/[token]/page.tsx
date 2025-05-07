'use client'
import { genPlayerId } from '@/app/actions/invite'
import { createInitialPlayer, getPlayerByPhone } from '@/app/db/playerQueries'
import { updateInviteWithPlayer } from '@/app/db/inviteQueries'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '@/app/components/PhoneAuth'
import { validateInvite } from '@/app/actions/invite'
import PlayerNameForm from '@/app/components/PlayerNameForm'
import { createGroupMembership, markInviteAsUsed } from '@/app/db/inviteQueries'
import { usePhoneNumber } from '@/app/hooks/usePhoneNumber'
import { Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/toaster"
import ReturningPlayerNewGroup from '@/app/components/ReturningPlayerNewGroup';
import { GroupProvider } from '@/app/context/GroupContext'
import { usePlayerName } from '@/app/hooks/usePlayerName'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { checkPlayerMembership } from '@/app/db/checkUserQueries'
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
  const [nextPage, setNextPage] = useState<boolean>(false);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState<string>('');
  const [pendingGroupId, setPendingGroupId] = useLocalStorage<string>('pendingGroupId', '');
  const [storedPlayerId, setStoredPlayerId] = useLocalStorage<string>('storedPlayerId', '');
  const [sanitizedPhone, setSanitizedPhone] = useState<string>('');

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
  const { playerName, isLoading: nameLoading, error: nameError } = usePlayerName(invite?.player_id)

  const handleSignupSuccess = async () => {
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      console.log('👤 User data:', user.id)
      const newUserId = user.id;
      if (!newUserId) {
        throw new Error('No user ID found in session');
      }
      setUserId(newUserId);
      const metaPhoneRaw = user.user_metadata?.phone_number || '';
      console.log('📞 Meta phone number:', metaPhoneRaw);
      const cleanPhone = (phone: string) => phone.replace(/^\+/, '').replace(/\D/g, '');
      const phoneToUse = metaPhoneRaw || phoneNumber || '';
      const cleanedPhone = cleanPhone(phoneToUse);
      setSanitizedPhone(cleanedPhone);

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
      
      // Get the invite ID from the database using the token
      const { data: inviteRecord, error: inviteError } = await supabase
      .from('invites')
      .select('id')
      .eq('token', token)
      .maybeSingle();

      if (inviteError || !inviteRecord) {
        console.error('Failed to fetch invite ID:', inviteError);
        throw new Error('Could not find invite record');
      }

      const inviteData = {
        ...result.data as Invite,
        id: inviteRecord.id // Add the invite ID from the database
      };
      console.log('Invite data:', inviteData)
      setInvite(inviteData)

      // NEW: if they’re already in that group, stop and send home
      const res = await fetch('/api/checkMembership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: sanitizedPhone,
          groupId: inviteData.group_id
        })
      })
      const { isMember } = await res.json()
      if (isMember) {
        router.replace('/')
        return
      }
  
      // 2. Look up existing player by phone
      const { data: existingPlayer, error: lookupErr } = await getPlayerByPhone(cleanedPhone)
      console.log('📱 Phone lookup results:', {
        phone: cleanedPhone,
        existingPlayer,
        error: lookupErr,
        isExisting: !!existingPlayer
      })
      if (lookupErr) throw lookupErr

      // 3. Decide which ID to use
      let playerIdToUse: string
      if (existingPlayer) {
        // returning user → brand‑new UUID
        const playerIdPair = await genPlayerId()
        playerIdToUse = playerIdPair.uuid
         // Insert the new "player" row
        const { data: newPlayer, error: newErr } = await createInitialPlayer(
        playerIdToUse,
        cleanedPhone,
        existingPlayer?.name,
        newUserId
      )
      if (newErr) throw newErr
      console.log('🆕 Created newPlayer:', newPlayer)
        // Link it to the invite
      await updateInviteWithPlayer(inviteData.id, newPlayer.id)
      console.log(`🔗 Linked invite ${inviteData.id} → player ${newPlayer.id}`)
      
      } else {
        // first‑time invite → use the seeded invite player_id
        playerIdToUse = inviteData.player_id
      }

      setStoredPlayerId(playerIdToUse)
      setIsReturning(!!existingPlayer)
      setNextPage(true)
    } catch (err) {
      console.error('🔥 handleSignupSuccess error:', err)
      setError('Failed to complete signup')
    }
  }

  const handleNameSubmit = async (name: string) => {
    if (!invite || !userId) return;
    try {
      // Use server actions instead of direct queries
      if (!phoneNumber) throw new Error('Phone number is required');
      const { error: updateErr } = await supabase
          .from('players')
          .update({ 
            name: name,
            phone: sanitizedPhone,
            user_id: userId,
            status: 'pending'
          })
          .eq('id', storedPlayerId)
    
        if (updateErr) throw updateErr
      console.log('📝 Updated first-time player info')
      await markInviteAsUsed(invite.id);
      await createGroupMembership(invite.player_id, invite.group_id); // can also use storedPlayerId here
      setPendingGroupId(invite.group_id);

      console.log('Registration complete, redirecting to pending approval...');
      await router.replace('/pending-approval');
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup');
    }
  }
  const handleReturningConfirm = async () => {
    if (!invite || !phoneNumber) return
    
    try {
      // Mark invite as used and create group membership
      await markInviteAsUsed(invite.id)
      await createGroupMembership(storedPlayerId, invite.group_id)
      setPendingGroupId(invite.group_id);

      await router.replace('/pending-approval')
    } catch (err) {
      console.error('❌ Error in handleReturningConfirm:', err)
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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg mt-2">
          Validating invite....
        </span>
      </div>
    );
  }

  return (
    <GroupProvider>
    <div className="max-w-md mx-auto p-6">
        {!nextPage ? (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-300 px-6 pt-20">
            <PhoneAuth onVerificationSuccess={handleSignupSuccess}/>
          </div>
       ) : isReturning ? (
        <ReturningPlayerNewGroup 
          groupId={invite?.group_id} 
          playerName={playerName}
          onConfirm={handleReturningConfirm} 
        />
      ) : (
        <PlayerNameForm onSubmit={handleNameSubmit} />
      )}
    </div>
    </GroupProvider>
  )
}