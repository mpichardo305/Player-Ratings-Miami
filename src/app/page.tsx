'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WaitingListPage from './components/WaitingListPage'
import AllGames from './components/AllGames'
import { supabase } from '@/app/utils/supabaseClient'
import { usePhoneNumber } from './hooks/usePhoneNumber'
import { checkPlayerMembership } from './db/checkUserQueries'
import { getMembershipFromCache, setMembershipCache, clearMembershipCache, GROUP_ID, saveRedirectUrl } from './utils/authUtils'

export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
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
        const result = await checkPlayerMembership(phoneNumber, GROUP_ID)
        console.log('Server membership check result:', result);
        
        setIsMember(result.isMember)
        
        // Update the cache with latest status from DB
        if (session?.user?.id) {
          setMembershipCache(session.user.id, {
            isMember: result.isMember,
            timestamp: new Date().getTime()
          })
        }
      } catch (error) {
        console.error('Error checking membership:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [phoneNumber, router])

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