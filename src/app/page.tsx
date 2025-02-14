"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { supabase } from "@/app/utils/supabaseClient";
import PhoneAuth from "@/app/components/PhoneAuth";
import Players from "@/app/players/page";
import InviteRegistration from "./invite/[token]/page";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const params = useParams();
  const token = params?.token as string;

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

  if (token && !session) {
    return <InviteRegistration token={token} />;
  }

  return (
    <div>
      {!session ? (
        <>
          <PhoneAuth />
        </>
      ) : (
        <Players />
      )}
    </div>
  );
}