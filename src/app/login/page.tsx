'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/app/utils/supabaseClient'
import PhoneAuth from '../components/PhoneAuth'
import { usePhoneNumber } from '../hooks/usePhoneNumber'
import { checkPlayerMembership } from '../db/checkUserQueries'
const InviteRegistration = dynamicImport(
  () => import('../invite/[token]/page'),
  { ssr: false }
)
import { 
  getMembershipFromCache, 
  cacheMembershipStatus, 
  GROUP_ID, 
  handleAuthRedirect, 
  resolveGroupContext,
  setLastActiveGroup 
} from '../utils/authUtils'
import { useGroup } from '../context/GroupContext'

export default function LoginPage() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [membershipChecked, setMembershipChecked] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [prevVerified, setPrevVerified] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const { setCurrentGroup } = useGroup();
  
  const hasAuthCookie = typeof window !== 'undefined' &&
  document.cookie.includes('supabase-auth-token');

  // Handle authentication state
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
      }
    )

    return () => authListener?.subscription.unsubscribe()
  }, [])

  // Check token validity if present
  useEffect(() => {
    async function checkToken() {
      if (token) {
        try {
          const response = await fetch(`/api/invites/validate?token=${token}`)
          const data = await response.json()
          setTokenStatus(data.status)
          setIsLoading(false)
        } catch (error) {
          console.error('Error validating token:', error)
          setIsLoading(false)
        }
      }
    }
    
    if (token) {
      checkToken()
    }
  }, [token])

  // Check for cached membership
  useEffect(() => {
    if (session?.user?.id) {
      const cachedMembership = getMembershipFromCache(session.user.id)
      
      if (cachedMembership) {
        console.log('Using cached membership status:', cachedMembership)
        setIsMember(cachedMembership.isMember)
        setPrevVerified(true)
        setIsLoading(false)
        
        if (!membershipChecked) {
          setIsRefreshing(true)
        }
      }
    }
  }, [session, membershipChecked])
  
  // Standard login page
  const handleLoginSuccess = () => {
    handleAuthRedirect(router);
  };
  // Check membership status
  useEffect(() => {
    if (membershipChecked && !isRefreshing) {
      setMembershipChecked(false)
    }

    async function checkMembership() {
      // If token but no session, stop loading
      if (token && !session) {
        setIsLoading(false)
        setMembershipChecked(true)
        return
      }
      
      // If no session and no auth in progress
      if (!session && document.cookie.indexOf('supabase-auth-token') === -1) {
        setIsLoading(false)
        setMembershipChecked(true)
        return
      }

      // If session but no phone, keep loading
      if (session && !phoneNumber) {
        return
      }

      // If session and phone, check membership
      if (session && phoneNumber) {
        try {
          const groupId = await resolveGroupContext(phoneNumber, setCurrentGroup);
          if (!groupId) {
            throw new Error('No group ID found');
          }
          const result = await checkPlayerMembership(phoneNumber, groupId)
          
          setIsMember(result.isMember)
          setMembershipChecked(true)
          setPrevVerified(true)
          
          // Cache the result
          cacheMembershipStatus(session.user.id, result.isMember)

          // Redirect based on membership status
          if (result.isMember) {
            handleLoginSuccess()
          } else {
            router.push('/waiting-list')
          }
        } catch (error) {
          console.error('Membership check failed:', error)
          setMembershipChecked(true)
        } finally {
          setIsRefreshing(false)
          setIsLoading(false)
        }
      }
    }

    checkMembership()
  }, [phoneNumber, session, token, isRefreshing, router])

  useEffect(() => {
    const handleLogin = async () => {
      if (!phoneNumber) return;
      const groupId = await resolveGroupContext(phoneNumber, setCurrentGroup);
      if (groupId) {
        setLastActiveGroup(groupId);
        handleAuthRedirect(router);
      } else {
        router.push('/pending-approval');
      }
    };

    if (phoneNumber) handleLogin();
  }, [phoneNumber]);

  // Show content when verification is complete or we have cached data
  const showContent =
    (token && !session) ||
    (!session && !hasAuthCookie) ||
    (session && (membershipChecked || prevVerified))

  if (!showContent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Optional background refresh indicator
  const RefreshIndicator = () => {
    if (isRefreshing) {
      return (
        <div className="fixed top-2 right-2 w-3 h-3">
          <div className="animate-ping w-3 h-3 rounded-full bg-blue-400 opacity-75"></div>
        </div>
      )
    }
    return null
  }

  // Handle token-based invite flow
  if (token && !session) {
    switch(tokenStatus) {
      case "already_used":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">This invitation has already been used</h2>
              <p className="mb-6">This invite link has already been claimed. If you're the one who claimed it, please log in to access the app.</p>
              <PhoneAuth />
            </div>
          </div>
        )
      
      case "expired":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Invitation Expired</h2>
              <p className="mb-6">This invitation has expired. Please request a new invitation from the administrator.</p>
              <a href="/" className="block w-full py-2 px-4 bg-blue-600 text-white rounded text-center">
                Return to Home
              </a>
            </div>
          </div>
        )
        
      case "invalid":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Invalid Invitation</h2>
              <p className="mb-6">This invitation link appears to be invalid. Please check that you've entered the correct URL or request a new invitation.</p>
              <a href="/" className="block w-full py-2 px-4 bg-blue-600 text-white rounded text-center">
                Return to Home
              </a>
            </div>
          </div>
        )

      case "revoked":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Invitation Revoked</h2>
              <p className="mb-6">This invitation has been revoked by an administrator. Please contact them if you believe this is an error.</p>
              <a href="/" className="block w-full py-2 px-4 bg-blue-600 text-white rounded text-center">
                Return to Home
              </a>
            </div>
          </div>
        )

      case "error":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Something Went Wrong</h2>
              <p className="mb-6">We encountered an error while validating your invitation. Please try again later.</p>
              <a href="/" className="block w-full py-2 px-4 bg-blue-600 text-white rounded text-center">
                Return to Home
              </a>
            </div>
          </div>
        )

      case "valid":
        return <InviteRegistration />
        
      default:
        if (isLoading) {
          return (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )
        }
        return <InviteRegistration />
    }
  }

  return (
    <div>
      <RefreshIndicator />
        <PhoneAuth />
    </div>
  )
}
