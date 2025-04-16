'use client';
import { useEffect } from 'react';
import { prefetchLeaderboardStats } from '@/lib/prefetch';

export function Preloader() {
  useEffect(() => {
    const prefetch = async () => {
      try {
        await prefetchLeaderboardStats();
      } catch (error) {
        console.error('Prefetch error:', error);
      }
    };

    // Prefetch after initial page load
    const timer = setTimeout(prefetch, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}