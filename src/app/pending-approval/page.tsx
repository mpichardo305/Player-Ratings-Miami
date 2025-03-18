'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { checkPlayerMembership } from '../db/checkUserQueries'
import { GROUP_ID } from '../utils/authUtils'
export default function PendingApproval() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading true
  const [checkingApproval, setCheckingApproval] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [checkAttempted, setCheckAttempted] = useState(false)
  const router = useRouter()

  //Next time, Might need to use hooks/useSession.ts

  // Get session data when component mounts
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session: userSession } } = await supabase.auth.getSession()
        setSession(userSession)
        
        // Extract phone number from session metadata
        if (userSession?.user?.user_metadata?.phone) {
          setPhoneNumber(userSession.user.user_metadata.phone)
        }
        
        console.log('Session:', userSession)
        console.log('Phone from metadata:', userSession?.user?.user_metadata?.phone)
        console.log('Group ID:', GROUP_ID)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getSession()
  }, [supabase.auth])

  // Get refresh count from local storage on initial load
  useEffect(() => {
    const savedCount = localStorage.getItem('refreshCount')
    if (savedCount) {
      setRefreshCount(parseInt(savedCount))
    }
  }, [])

  const checkApprovalStatus = async () => {
    if (!session) {
      alert("Unable to check status: user not logged in")
      return
    }
    
    if (!phoneNumber) {
      alert("Unable to check status: phone number not found in your profile")
      return
    }
    
    setCheckingApproval(true)
    
    try {
      console.log(`Checking membership for phone: ${phoneNumber} and group: ${GROUP_ID}`)
      const result = await checkPlayerMembership(phoneNumber, GROUP_ID)
      console.log('Membership check result:', result)
      
      // Increment and save refresh count
      const newCount = refreshCount + 1
      setRefreshCount(newCount)
      localStorage.setItem('refreshCount', newCount.toString())
      
      // Redirect if approved, otherwise show message
      if (result.isMember) {
        router.push('/')
      } else {
        setCheckAttempted(true)
      }
    } catch (error) {
      console.error('Error checking membership status:', error)
      alert("There was an error checking your status")
    } finally {
      setCheckingApproval(false)
    }
  }

  // Show loading state while session data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading session data...</span>
      </div>
    )
  }

  // Show loading state during approval check
  if (checkingApproval) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Checking approval status...</span>
      </div>
    )
  }

  // Show login message if no session
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full p-6 rounded-lg border border-red-500 bg-gray-800">
          <h1 className="text-2xl font-bold text-center mb-4">Not Logged In</h1>
          <p className="text-center mb-4">
            Please log in to check your approval status.
          </p>
          <div className="text-center">
            <Link 
              href="/login" 
              className="inline-block px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-md w-full p-6 rounded-lg border border-gray-700 bg-gray-800">
        <h1 className="text-2xl font-bold text-center mb-4">Thank You for Signing Up!</h1>
        
        <div className="space-y-4">
          <p className="text-center">
            Your registration has been received and is now pending approval.
          </p>
          
          <div className="p-4 rounded-lg bg-gray-700">
            <h2 className="font-semibold mb-2">Next Steps:</h2>
            <p className="mb-2">A group admin needs to approve your membership.</p>
            <p>Please message your admin to log in and approve your request.</p>
          </div>
          
          {checkAttempted && (
            <div className="p-4 rounded-lg bg-gray-700 border border-yellow-600">
              <p className="text-center font-semibold">
                You have not been approved yet.
              </p>
              <p className="text-center text-sm mt-1">
                You've checked {refreshCount} {refreshCount === 1 ? 'time' : 'times'}
              </p>
            </div>
          )}
          
          <div className="text-center mt-6 space-y-3">
            <button 
              onClick={checkApprovalStatus}
              className="inline-block px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Check Approval Status
            </button>            
          </div>
        </div>
      </div>
    </div>
  )
}

