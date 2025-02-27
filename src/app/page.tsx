'use client'

import { usePhoneNumber } from './hooks/usePhoneNumber'
import { useState, useEffect } from 'react'
import WaitingListPage from './components/WaitingListPage'
import Players from './players/page'
import { checkPlayerMembership } from './db/checkUserQueries'

export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  
  const GROUP_ID = '299af152-1d95-4ca2-84ba-4332828438e'

  useEffect(() => {
    async function checkMembership() {
      if (!phoneNumber) {
        setIsLoading(false)
        return
      }

      try {
        const { isMember } = await checkPlayerMembership(phoneNumber, GROUP_ID)
        setIsMember(isMember)
      } catch (error) {
        console.error('Error checking membership:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkMembership()
  }, [phoneNumber])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!phoneNumber) {
    return <div>Please verify your phone number first</div>
  }

  return isMember ? <Players /> : <WaitingListPage />
}