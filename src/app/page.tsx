"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/utils/supabaseClient";
import PhoneAuth from "@/app/components/PhoneAuth";
import Players from "@/app/players/page";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

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