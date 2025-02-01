// /hooks/useSession.ts
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      } else {
        console.log("Fetched session:", session);
      }
      setSession(session);
    };

    fetchSession();
  }, []);

  return session;
}