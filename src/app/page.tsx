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


export default function Home() {
  const { phoneNumber } = usePhoneNumber()
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [session, setSession] = useState<Session | null>(null);
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

  // Second useEffect for membership check, dependent on both session and phoneNumber
  useEffect(() => {
    console.log('=== Membership Check Effect Triggered ===');
    console.log('Dependencies changed:', { 
      phoneNumber, 
      hasSession: !!session,
      sessionPhone: session?.user?.phone,
      currentIsMember: isMember 
    });

    async function checkMembership() {
      if (!phoneNumber || !session) {
        console.log('Skipping check - Missing requirements:', {
          hasPhoneNumber: !!phoneNumber,
          hasSession: !!session
        });
        setIsLoading(false);
        return;
      }

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
          willUpdate: result.isMember !== isMember
        });
        
        setIsMember(result.isMember);
      } catch (error) {
        console.error('Membership check failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkMembership();
  }, [phoneNumber, session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (token && !session) {
    return <InviteRegistration />;
  }

  return (
    <div>
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