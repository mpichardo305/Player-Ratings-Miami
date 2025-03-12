import { useState, useEffect } from 'react';
import { supabase } from '@/app/utils/supabaseClient';

export const usePhoneNumber = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoneNumber = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setPhoneNumber(session?.user?.user_metadata?.phone_number || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch phone number');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoneNumber();

    // Subscribe to auth changes to update phone number when user data changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setPhoneNumber(session?.user?.user_metadata?.phone_number || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { phoneNumber, isLoading, error, refreshPhoneNumber: fetchPhoneNumber };
};