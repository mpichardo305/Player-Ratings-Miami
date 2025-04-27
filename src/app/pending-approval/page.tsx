'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { usePhoneNumber } from '../hooks/usePhoneNumber'
import { checkPlayerMembershipById } from '../db/checkUserQueries'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Toaster, useToast } from "@/components/ui/toaster"
import { handleAuthRedirect } from '../utils/authUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { set } from 'lodash'

export default function PendingApproval() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const { phoneNumber, isLoading: phoneLoading } = usePhoneNumber()
  const [playerId, setPlayerId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [checkingApproval, setCheckingApproval] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [checkAttempted, setCheckAttempted] = useState(false)
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const { toast } = useToast()
  const [groupId] = useLocalStorage<string>('pendingGroupId', '')
  // Get session data when component mounts
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session: userSession } } = await supabase.auth.getSession()
        setSession(userSession)
        console.log('Session:', userSession)
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

    // Get refresh count from local storage on initial load
    useEffect(() => {
      const playerId = localStorage.getItem('storedPlayerId')
      setPlayerId(playerId)
    }, [])

  // Debug phone number from hook
  useEffect(() => {
    console.log('Phone number from hook:', phoneNumber)
  }, [phoneNumber])

  const checkApprovalStatus = async () => {
    console.log("Starting approval check...")
    console.log("Session:", session)
    console.log("Player Id:", playerId)
    console.log("Phone number:", phoneNumber)


    if (!phoneNumber) {
      console.error("Phone number or group ID missing, cannot proceed with check")
      setShowLogin(true);
      return;
    }
    
    setCheckingApproval(true)
    const handleLoginSuccess = () => {
      handleAuthRedirect(router);
    };
    try {
      console.log(`Checking membership for phone: ${phoneNumber} and group: ${groupId}`)
      const result = await checkPlayerMembershipById(playerId, groupId)
      console.log('Membership check result:', result)
      
      // Increment and save refresh count
      const newCount = refreshCount + 1
      setRefreshCount(newCount)
      localStorage.setItem('refreshCount', newCount.toString())
      
      // Redirect if approved, otherwise show message
      if (result.isMember) {
        console.log("User approved, redirecting to home")
        handleLoginSuccess()
      } else {
        console.log("User not yet approved, showing message")
        setCheckAttempted(true)
        toast({
          title: "Not Approved Yet",
          description: `You've checked ${newCount} ${newCount === 1 ? 'time' : 'times'}. Please wait for admin approval.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Error checking membership status:', error)
      toast({
        title: "Error",
        description: "There was an error checking your status",
        variant: "destructive",
      })
    } finally {
      setCheckingApproval(false)
    }
  }

  const isPageLoading = isLoading || phoneLoading

  if (isPageLoading || checkingApproval) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">
            {checkingApproval ? 'Checking approval status...' : 'Loading user data...'}
          </span>
        </div>
      </div>
    )
  }

  if (showLogin && !isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Not Logged In</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please log in to check your approval status.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="default" asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Thank You for Signing Up!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your registration has been received and is now pending approval.
          </p>
          
          <Card>
            <CardContent className="pt-6 space-y-8">
              <div>
                <p className="text-md text-muted-foreground">
                  A group admin needs to approve your membership.
                </p>
              </div>
              
              <div>
                <h2 className="font-semibold mb-2">What you can do:</h2>
                <p className="text-sm text-muted-foreground">
                  Please message your admin to log in and approve your request.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={checkApprovalStatus}
            disabled={checkingApproval}
            className="w-full sm:w-auto"
          >
            {checkingApproval && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Check Approval Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

