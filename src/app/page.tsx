'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import WaitingListPage from './components/WaitingListPage'
import AllGames from './components/AllGames'
import { supabase } from '@/app/utils/supabaseClient'
import { usePhoneNumber } from './hooks/usePhoneNumber'
import { checkPlayerMembership } from './db/checkUserQueries'
import { getMembershipFromCache, setMembershipCache, clearMembershipCache, getGroupId, saveRedirectUrl, resolveGroupContext } from './utils/authUtils'
import { useGroup } from './context/GroupContext'
import { useGroupName } from './hooks/useGroupName'

export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const { updateGroupMembership, setCurrentGroup, isCurrentGroupAdmin, currentGroup } = useGroup()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)
  const router = useRouter()
  const groupId = getGroupId();
  const { groupName } = useGroupName(groupId || '')
  const ranRef = useRef(false)
  const startTimeRef = useRef(performance.now());
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user.id);
      if (!session) {
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

      // Set dependenciesLoaded to true once session is available
      setDependenciesLoaded(true);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function performMembershipCheck() {
      if (!dependenciesLoaded) {
        console.log('Dependencies not loaded yet, skipping membership check.');
        return;
      }

      if (!phoneNumber) {
        console.log('No phone number available, cannot check membership');
        setIsLoading(false);
        return;
      }

      console.log('Verifying membership with server for phone:', phoneNumber);

      try {
        let activeGroupId = groupId || '';

        if (!activeGroupId) {
          console.log('No group ID found, resolving group context...');
          const resolvedGroupId = await resolveGroupContext(phoneNumber, setCurrentGroup);
          if (!resolvedGroupId) {
            console.log('Could not resolve group context');
            setIsLoading(false);
            return;
          }
          console.log('Group context resolved, new group ID:', resolvedGroupId);
          activeGroupId = resolvedGroupId;
        }

        console.log('Using group ID for membership check:', activeGroupId);

        const result = await checkPlayerMembership(phoneNumber, activeGroupId);
        console.log('checkPlayerMembership result:', JSON.stringify(result, null, 2));

        setIsMember(result.isMember);

        if (result.playerId && result.status) {
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
          const fetchedGroupName = groupData?.name ?? '';

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

        if (user) {
          setMembershipCache(user, {
            isMember: result.isMember,
            timestamp: new Date().getTime(),
            playerId: result.playerId
          });
        }
      } catch (error) {
        console.error('Error checking membership:', error);
      } finally {
        setIsLoading(false);
        const endTime = performance.now();
        const loadTime = endTime - startTimeRef.current;
        console.log(`Home component loaded in ${loadTime}ms`);
      }
    }

    performMembershipCheck();
  }, [phoneNumber, dependenciesLoaded]);

  if (isLoading || !dependenciesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {!isMember ? <WaitingListPage /> : <AllGames />}
    </div>
  )
}