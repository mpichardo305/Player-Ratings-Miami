import { useState, useEffect } from 'react';
import { supabase } from '@/app/utils/supabaseClient';

export const usePhoneNumber = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setPhoneNumber(session?.user?.user_metadata?.phone_number || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch phone number');
      } finally {
        setIsLoading(false);
      }
    };

    getPhoneNumber();
  }, []);

  return { phoneNumber, isLoading, error };
};