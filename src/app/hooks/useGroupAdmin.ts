"use client";

import { useState, useEffect } from 'react';

// Return [isLoading, isAdmin] tuple
export function useGroupAdmin(userId: string, groupId: string | null): [boolean, boolean] {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Reset the state when inputs change
      setLoading(true);
      
      if (!userId || !groupId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log(`Checking admin status for user: ${userId}, group: ${groupId}`);
        
        // Uncomment for testing with hardcoded admin status
        if (userId === '3e0a04fb-6e4b-41ee-899f-a7f1190b57f5') {
          console.log("Using hardcoded admin status: true");
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/check-admin?userId=${userId}&groupId=${groupId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check admin status');
        }
        
        const data = await response.json();
        console.log('Admin API response:', data);
        
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [userId, groupId]);

  return [loading, isAdmin];
}