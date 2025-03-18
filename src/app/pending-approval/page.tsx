'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePhoneNumber } from '../hooks/usePhoneNumber'
import { useSession } from '../hooks/useSession'  // Import the session hook
import { checkPlayerMembership } from '../db/checkUserQueries'
import { GROUP_ID } from '../utils/authUtils'
export default function PendingApproval() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [checkAttempted, setCheckAttempted] = useState(false)
  const router = useRouter()

  // Get refresh count from local storage on initial load
  useEffect(() => {
    const savedCount = localStorage.getItem('refreshCount')
    if (savedCount) {
      setRefreshCount(parseInt(savedCount))
    }
  }, [])

  const checkApprovalStatus = async () => {
    if (!phoneNumber) {
      alert("Unable to check status: phone number not found")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await checkPlayerMembership(phoneNumber, GROUP_ID)
      
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
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
