import { useState, useEffect } from 'react';
import { supabase } from "@/app/utils/supabaseClient";

export function useGroupAdmin(sessionUserId: string, groupId: string | null) {
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  useEffect(() => {
    if (!sessionUserId || !groupId) return;
    
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("group_admins")
        .select("id")
        .eq("player_id", sessionUserId)
        .eq("group_id", groupId)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking admin status:", error);
      }
      setIsGroupAdmin(!!data);
    };

    checkAdmin();
  }, [sessionUserId, groupId]);

  return isGroupAdmin;
}