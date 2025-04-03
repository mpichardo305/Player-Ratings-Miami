"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import { Loader2 } from 'lucide-react';
import { saveRedirectUrl } from '../utils/authUtils';

interface SessionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SessionGuard({ children, fallback }: SessionGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log("No session found, saving path:", window.location.pathname);
          saveRedirectUrl(window.location.pathname);
          setIsAuthenticated(false);
          router.push('/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to check session:", err);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          router.push('/login');
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="text-sm ml-2">Verifying the session...</span>
        
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        <Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">
        Redirecting to Login
      </span>
      </div>
    );
  }

  return <>{children}</>;
}
