"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { formatDateOnly, formatDatePreserveDay, formatTimeOnly } from "@/app/utils/dateUtils";
import GameEditor from "@/app/components/GameEditor";
import { supabase } from "@/app/utils/supabaseClient";
import { Player, fetchGamePlayers } from "@/app/utils/playerDb";

type Game = {
  id: string;
  date: string;
  field_name: string;
  start_time: string;
  group_id: string;
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view'; // Default to view mode
  
  const gameId = params.gameId as string;
  const [game, setGame] = useState<Game | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  // Fetch game players
  useEffect(() => {
    const loadGamePlayers = async () => {
      if (!gameId) return;
      
      setPlayersLoading(true);
      try {
        const gamePlayers = await fetchGamePlayers(gameId);
        setPlayers(gamePlayers);
      } catch (error) {
        console.error("Error loading game players:", error);
      } finally {
        setPlayersLoading(false);
      }
    };

    if (gameId) {
      loadGamePlayers();
    }
  }, [gameId]);

  const fetchGroupName = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();
        
      if (error) {
        console.error('Error fetching group name:', error);
        return;
      }
      
      if (data && data.name) {
        setGroupName(data.name);
      }
    } catch (err) {
      console.error('Error in fetchGroupName:', err);
    }
  };

  // Check if user is admin for this game's group
  const [isAdminCheckLoading, isAdmin] = useGroupAdmin(session?.user?.id ?? '', game?.group_id ?? null);

  // Track when admin check completes
  useEffect(() => {
    if (!isAdminCheckLoading && game?.group_id) {
      setAdminCheckComplete(true);
      fetchGroupName(game.group_id);
    }
  }, [isAdminCheckLoading, game?.group_id]);

  // Redirect only after initial load and admin check are complete
  useEffect(() => {
    if (!initialLoad && adminCheckComplete && mode === 'edit' && !isAdmin) {
      console.log("Redirecting to view mode - not an admin");
      router.push(`/game/${gameId}?mode=view`);
    }
  }, [initialLoad, adminCheckComplete, isAdmin, mode, gameId, router]);

  // Debug panel 
  const debugPanel = (
    <div className="bg-gray-800 text-white p-4 mb-4 rounded-lg text-xs">
      <h3 className="font-bold mb-1">Debug Info</h3>
      <div>User ID: {session?.user?.id || 'none'}</div>
      <div>Game Group: {game?.group_id || 'none'}</div>
      <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
      <div>Mode: {mode}</div>
    </div>
  );

  if (loading || isAdminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {/* {debugPanel} */}
        <div className="text-white text-center p-8">
          Loading game details...
        </div>
      </div>
    );
  }

  if (error && (mode !== 'edit' || !isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {debugPanel}
        <div className="text-red-500 text-center p-8">{error}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {debugPanel}
        <div className="text-red-500 text-center p-8">Game not found</div>
      </div>
    );
  }

  // Prevent unauthorized edit access
  if (mode === 'edit' && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {/* {debugPanel} */}
        <div className="text-red-500 text-center p-8">
          You do not have permission to edit this game.
        </div>
      </div>
    );
  }

  // View Mode
  if (mode === 'view') {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {/* {debugPanel} */}
        <h1 className="text-3xl font-bold mb-6 text-white">Game Details</h1>
        
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">{`${game.field_name}`}</h2>
          <h3 className="text-xl font-semibold text-white mb-4">{`${groupName}`}</h3>
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Date</p>
              <p className="text-white">{`${(formatDatePreserveDay(game.date))}`}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Start Time</p>
              <p className="text-white">{`${(formatTimeOnly(game.start_time))}`}</p>
            </div>
          </div>
        </div>
        
        {/* Player Roster */}
        <div className="mt-6 bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Roster</h3>
          {playersLoading ? (
            <p className="text-white">Loading players...</p>
          ) : players.length === 0 ? (
            <p className="text-white">No players assigned to this game.</p>
          ) : (
            <div className="max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {players.map((player) => (
                  <div key={player.id} className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-white">{player.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Add buttons for different operations */}
        {isAdmin && (
          <div className="mt-6 flex gap-8">
            <button
              onClick={() => router.push(`/game/${gameId}?mode=edit`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Edit Game Details
            </button>
            <button
              onClick={() => router.push(`/manage-players/${gameId}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Manage Players
            </button>
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Edit Mode - Use the unified GameEditor component
  return (
    <div className="min-h-screen bg-gray-600 p-4">
      {/* {debugPanel} */}
      <GameEditor mode="edit" gameId={gameId} />
    </div>
  );
}
