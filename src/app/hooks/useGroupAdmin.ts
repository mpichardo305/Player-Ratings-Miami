"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Return isAdmin boolean
export function useGroupAdmin(playerId: string, groupId: string): { isAdmin: boolean, loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!playerId || !groupId) {
        setLoading(false);
        return;
      }

      try {
        console.log(`Checking admin status for player: ${playerId}, group: ${groupId}`);
        const response = await fetch(`/api/check-admin?playerId=${playerId}&groupId=${groupId}`);
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [playerId, groupId]);

  return { isAdmin, loading };
}