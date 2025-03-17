'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WaitingListPage from '../components/WaitingListPage'
import { supabase } from '@/app/utils/supabaseClient'

export default function WaitingList() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If not authenticated, redirect to login page
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <WaitingListPage />
}
