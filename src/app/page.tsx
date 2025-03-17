'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WaitingListPage from './components/WaitingListPage'
import AllGames from './components/AllGames'
import { supabase } from '@/app/utils/supabaseClient'
import { usePhoneNumber } from './hooks/usePhoneNumber'
import { checkPlayerMembership } from './db/checkUserQueries'
import { getMembershipFromCache, GROUP_ID } from './utils/authUtils'


export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If not authenticated, redirect to login page
        router.push('/login')
        return
      }
      
      // Check membership from cache first
      const cachedMembership = getMembershipFromCache(session.user.id)
      if (cachedMembership) {
        setIsMember(cachedMembership.isMember)
        setIsLoading(false)
        return
      }
      
      // If no phone number yet, we can't check membership
      if (!phoneNumber) return
      
      // Check membership status
      try {
        const result = await checkPlayerMembership(phoneNumber, GROUP_ID)
        setIsMember(result.isMember)
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