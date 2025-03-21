"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UnratedPlayersList from '@/app/components/UnratedPlayersList';
import SessionGuard from '@/app/components/SessionGuard';
import { supabase } from '@/app/utils/supabaseClient';
import { hasGameEnded } from '@/app/utils/gameUtils';
import { formatDatePreserveDay, formatTimeOnly } from "@/app/utils/dateUtils";

type Game = {
  id: string;
  date: string;
  start_time: string;
  field_name?: string;  // Changed from fieldName to field_name to match API response
};

function RatePlayersContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const [userId, setUserId] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current user ID directly from Supabase
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    getUserId();
  }, []);

  // Fetch game data to verify it has ended
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        
        const data = await response.json();
        console.log('Game data from API:', data);
        
        // Set the game data from the API response
        setGame(data);
        
        // Check if game has ended
        if (!hasGameEnded(data.date, data.start_time)) {
          setError('This game has not ended yet. You can only rate players after the game has finished.');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        <div className="text-white text-center p-8">
          Loading game details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        <div className="bg-red-500 text-white p-4 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push(`/game/${gameId}`)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Game Details
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-600 p-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Rate Players</h1>
      <p className="text-gray-300 mb-4">
        Rate the players who participated in this game
      </p>
      
      {/* Game Info Card */}
      {game && (
        <div className="bg-gray-700 rounded-md p-3 mb-4 text-white shadow">
          <h3 className="text-lg font-semibold">{game.field_name}</h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <span className="text-gray-400">Date:</span> {formatDatePreserveDay(game.date)}
            </div>
            <div>
              <span className="text-gray-400">Time:</span> {formatTimeOnly(game.start_time)}
            </div>
          </div>
        </div>
      )}
      
      {userId && (
        <UnratedPlayersList 
          sessionUserId={userId}
          gameId={gameId}
        />
      )}
      
      <div className="mt-6">
        <button
          onClick={() => router.push(`/game/${gameId}`)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Game Details
        </button>
      </div>
    </div>
  );
}

export default function RatePlayersPage() {
  return (
    <SessionGuard>
      <RatePlayersContent />
    </SessionGuard>
  );
}
