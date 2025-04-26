'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WaitingListPage from './components/WaitingListPage'
import AllGames from './components/AllGames'
import { supabase } from '@/app/utils/supabaseClient'
import { usePhoneNumber } from './hooks/usePhoneNumber'
import { checkPlayerMembership } from './db/checkUserQueries'
import { getMembershipFromCache, setMembershipCache, clearMembershipCache, getGroupId, saveRedirectUrl, resolveGroupContext } from './utils/authUtils'
import { useGroup } from './context/GroupContext' // Add this at the top with other imports
import { useGroupName } from './hooks/useGroupName'

export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const { updateGroupMembership, setCurrentGroup, isCurrentGroupAdmin } = useGroup()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [checkedMembership, setCheckedMembership] = useState(false)
  const router = useRouter()
  const groupId = getGroupId();
  // Move the useGroupName hook to the component level
  const { groupName } = useGroupName(groupId || '')

  useEffect(() => {
    async function checkAuth() {
      // Skip if we've already checked membership
      if (checkedMembership) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Don't save redirect for home page
        if (window.location.pathname !== '/') {
          saveRedirectUrl(window.location.pathname);
        }
        router.push('/login')
        return
      }
      
      console.log('Session found, checking membership for user:', session.user.id);
      
      // Check if URL has force refresh parameter
      const forceRefresh = new URLSearchParams(window.location.search).get('refresh') === 'true';
      if (forceRefresh) {
        console.log('Force refresh requested, clearing membership cache');
        clearMembershipCache(session.user.id);
      }
      
      // Check membership from cache first
      const cachedMembership = getMembershipFromCache(session.user.id)
      
      // If cache shows the user IS a member, we can trust that
      if (cachedMembership && cachedMembership.isMember === true) {
        console.log('Using cached membership: User is a member');
        setIsMember(true)
        setIsLoading(false)
        return
      }
      
      // If no phone number yet, we can't check membership
      if (!phoneNumber) {
        console.log('No phone number available, cannot check membership');
        return;
      }
      
      console.log('Verifying membership with server for phone:', phoneNumber);
      // For non-members or no cache data, always verify with DB
      // This ensures recently approved members get updated status
      try {
        let activeGroupId = groupId || '';
        
        if (!activeGroupId) {
          console.log('No group ID found, resolving group context...');
          const resolvedGroupId = await resolveGroupContext(phoneNumber, setCurrentGroup);
          if (!resolvedGroupId) {
            console.log('Could not resolve group context');
            setIsLoading(false);
            setCheckedMembership(true); // Mark as checked even if failed
            return;
          }
          console.log('Group context resolved, new group ID:', resolvedGroupId);
          activeGroupId = resolvedGroupId;
        }

        // Verify group ID is set before proceeding
        console.log('Using group ID for membership check:', activeGroupId);
        
        // Now check membership with the confirmed group ID
        const result = await checkPlayerMembership(phoneNumber, activeGroupId);
        console.log('checkPlayerMembership result:', JSON.stringify(result, null, 2));
        
        setIsMember(result.isMember);
        
        if (result.playerId && result.status) {
          // Update both membership and group context with the latest data
          updateGroupMembership(activeGroupId, {
            isMember: result.isMember,
            playerId: result.playerId,
            status: result.status
          });

          const { data: groupData } = await supabase
          .from('groups')
          .select('name')
          .eq('id', activeGroupId)
          .single();
        const fetchedGroupName = groupData?.name ?? ''
          // Update group context with final data
          const finalGroupData = {
            id: activeGroupId,
            name: groupName || fetchedGroupName || '',
            isAdmin: isCurrentGroupAdmin,
            isMember: result.isMember,
            memberStatus: result.status,
            playerId: result.playerId
          };
          setCurrentGroup(finalGroupData);
        }

        // Mark membership as checked after successful check
        setCheckedMembership(true);

        // Update cache
        if (session?.user?.id) {
          setMembershipCache(session.user.id, {
            isMember: result.isMember,
            timestamp: new Date().getTime(),
            playerId: result.playerId
          });
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setCheckedMembership(true); // Mark as checked even if error
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [phoneNumber, router, updateGroupMembership, setCurrentGroup, isCurrentGroupAdmin, checkedMembership, groupName]); // Add checkedMembership and groupName to deps

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show appropriate content based on membership status
  return (
    <div>
      {!isMember ? <WaitingListPage /> : <AllGames />}
    </div>
  )
}