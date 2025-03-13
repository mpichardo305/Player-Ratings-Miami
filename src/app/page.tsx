'use client'

import { usePhoneNumber } from './hooks/usePhoneNumber'
import { useState, useEffect } from 'react'
import WaitingListPage from './components/WaitingListPage'
import Players from './players/page'
import InviteRegistration from "./invite/[token]/page";
import { checkPlayerMembership } from './db/checkUserQueries'
import PhoneAuth from './components/PhoneAuth'
import { supabase } from "@/app/utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

// Constants
const MEMBERSHIP_CACHE_KEY = 'playerRatingsMembershipCache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Helper to read from cache
function getMembershipFromCache(userId: string | undefined) {
  if (!userId || typeof window === 'undefined') return null;
  
  try {
    const cachedData = localStorage.getItem(MEMBERSHIP_CACHE_KEY);
    if (!cachedData) return null;
    
    const { userId: cachedUserId, isMember, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is valid (same user and not expired)
    if (cachedUserId === userId && (Date.now() - timestamp) < CACHE_TTL) {
      return { isMember, isFromCache: true };
    }
  } catch (e) {
    console.error('Error reading membership cache:', e);
  }
  return null;
}

// Helper to write to cache
function cacheMembershipStatus(userId: string, isMember: boolean) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({
      userId,
      isMember,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error writing to membership cache:', e);
  }
}

export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [membershipChecked, setMembershipChecked] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Flag for background refresh
  const [session, setSession] = useState<Session | null>(null);
  const [prevVerified, setPrevVerified] = useState(false); // Track if we've previously verified
  const params = useParams();
  const token = params?.token as string;

  const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'

  // First useEffect for authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, []);

  // Check for cached membership on initial load or session change
  useEffect(() => {
    if (session?.user?.id) {
      const cachedMembership = getMembershipFromCache(session.user.id);
      
      if (cachedMembership) {
        console.log('Using cached membership status:', cachedMembership);
        setIsMember(cachedMembership.isMember);
        setPrevVerified(true);
        setIsLoading(false);
        
        // If using cache, still refresh in background but don't show loading state
        if (!membershipChecked) {
          setIsRefreshing(true);
        }
      }
    }
  }, [session]);

  // Second useEffect for membership check
  useEffect(() => {
    console.log('=== Membership Check Effect Triggered ===');
    console.log('Dependencies changed:', { 
      phoneNumber, 
      hasSession: !!session,
      sessionPhone: session?.user?.phone,
      membershipCheckedStatus: membershipChecked,
      isPreviouslyVerified: prevVerified
    });

    // Don't reset membership check if we're just refreshing in the background
    if (membershipChecked && !isRefreshing) {
      setMembershipChecked(false);
    }

    async function checkMembership() {
      // If no session but we have a token for registration, we can stop loading
      if (token && !session) {
        setIsLoading(false);
        setMembershipChecked(true);
        return;
      }
      
      // If no session and no auth in progress, go to login
      if (!session && document.cookie.indexOf('supabase-auth-token') === -1) {
        setIsLoading(false);
        setMembershipChecked(true);
        return;
      }

      // If we have a session but no phone yet, keep loading
      if (session && !phoneNumber) {
        return;
      }

      // If we have both session and phone, check membership
      if (session && phoneNumber) {
        try {
          console.log('Calling checkPlayerMembership with:', {
            phoneNumber,
            GROUP_ID,
            sessionId: session.user.id
          });
          
          const result = await checkPlayerMembership(phoneNumber, GROUP_ID);
          
          console.log('Membership check complete:', {
            result,
            previousIsMember: isMember,
          });
          
          setIsMember(result.isMember);
          setMembershipChecked(true);
          setPrevVerified(true);
          
          // Cache the result for future visits
          cacheMembershipStatus(session.user.id, result.isMember);
        } catch (error) {
          console.error('Membership check failed:', error);
          setMembershipChecked(true);
        } finally {
          setIsRefreshing(false);
          setIsLoading(false);
        }
      }
    }

    checkMembership();
  }, [phoneNumber, session, token, isRefreshing]);

  // More optimistic rendering logic - show content if we have cached verification
  // or if all conditions are met as before
  const showContent = (token && !session) || 
                     (!session && document.cookie.indexOf('supabase-auth-token') === -1) || 
                     (session && (membershipChecked || prevVerified));

  if (!showContent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Optional subtle indicator when refreshing in background
  const RefreshIndicator = () => {
    if (isRefreshing) {
      return (
        <div className="fixed top-2 right-2 w-3 h-3">
          <div className="animate-ping w-3 h-3 rounded-full bg-blue-400 opacity-75"></div>
        </div>
      );
    }
    return null;
  };

  if (token && !session) {
    return <InviteRegistration />;
  }

  return (
    <div>
      <RefreshIndicator />
      {!session ? (
        <>
          <PhoneAuth />
        </>
      ) : (
        !isMember ? <WaitingListPage/> : <Players />
      )}
    </div>
  );
}