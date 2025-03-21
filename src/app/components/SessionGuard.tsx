"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';

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
        
        if (error) {
          console.error("Session error:", error);
          setIsAuthenticated(false);
          router.push('/login');
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to login");
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
      <div className="min-h-screen bg-gray-600 p-4">
        <div className="text-white text-center p-8">
          Verifying session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        <div className="text-white text-center p-8">
          Redirecting to login...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
