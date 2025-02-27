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

  if (!session) {
    return <PhoneAuth />
  }

  return isMember ? <Players /> : <WaitingListPage />
}