"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { formatDate } from "@/app/utils/dateUtils";

type Game = {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  
  // Add states to track initialization
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  // Form state (only needed for edit mode)
  const [fieldName, setFieldName] = useState("");
  const [startTime, setStartTime] = useState("");
  
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
        
        // Initialize form state if in edit mode
        if (mode === 'edit') {
          setFieldName(data.field_name);
          setStartTime(data.start_time.substring(0, 16)); // Format for datetime-local input
        }
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
  }, [gameId, mode]);

  // Check if user is admin for this game's group
  const [isAdminCheckLoading, isAdmin] = useGroupAdmin(session?.user?.id ?? '', game?.group_id ?? null);

  // Track when admin check completes
  useEffect(() => {
    if (!isAdminCheckLoading && game?.group_id) {
      setAdminCheckComplete(true);
      
      // Log for debugging
      console.log({
        adminCheckComplete: true,
        isAdmin,
        mode,
        shouldRedirect: mode === 'edit' && !isAdmin
      });
    }
  }, [isAdminCheckLoading, game?.group_id, isAdmin, mode]);

  // Redirect only after initial load and admin check are complete
  useEffect(() => {
    if (!initialLoad && adminCheckComplete && mode === 'edit' && !isAdmin) {
      console.log("Redirecting to view mode - not an admin");
      router.push(`/game/${gameId}?mode=view`);
    }
  }, [initialLoad, adminCheckComplete, isAdmin, mode, gameId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError("You don't have permission to edit this game");
      return;
    }
    
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: fieldName,
          start_time: new Date(startTime).toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update game');
      }
      
      // Redirect to view mode after successful update
      router.push(`/game/${gameId}?mode=view`);
    } catch (error) {
      console.error('Error updating game:', error);
      setError('Failed to update game');
    }
  };

  // Debug panel to help investigate issues
  const debugPanel = (
    <div className="bg-gray-800 text-white p-4 mb-4 rounded-lg text-xs">
      <h3 className="font-bold mb-1">Debug Info</h3>
      <div>User ID: {session?.user?.id || 'none'}</div>
      <div>Game Group: {game?.group_id || 'none'}</div>
      <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
      <div>Mode: {mode}</div>
      <div>Initial Load: {initialLoad ? 'Yes' : 'No'}</div>
      <div>Admin Check Complete: {adminCheckComplete ? 'Yes' : 'No'}</div>
      <div>Admin Check Loading: {isAdminCheckLoading ? 'Yes' : 'No'}</div>
    </div>
  );

  if (loading || isAdminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-600 p-4">
        {debugPanel}
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
        {debugPanel}
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
        {debugPanel}
        <h1 className="text-3xl font-bold mb-6 text-white">Game Details</h1>
        
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">{game.field_name}</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 text-sm">Start Time</p>
              <p className="text-white">{formatDate(game.start_time)}</p>
            </div>
          </div>
        </div>
        
        {/* Add edit button outside the details card for admins */}
        {isAdmin && (
          <div className="mt-6">
            <button
              onClick={() => router.push(`/game/${gameId}?mode=edit`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Switch to Edit Mode
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Edit Mode (only accessible by admins)
  return (
    <div className="min-h-screen bg-gray-600 p-4">
      {debugPanel}
      <h1 className="text-3xl font-bold mb-6 text-white">Edit Game</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-700 rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="field_name" className="block text-white mb-2">Field Name</label>
          <input
            type="text"
            id="field_name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="start_time" className="block text-white mb-2">Start Time</label>
          <input
            type="datetime-local"
            id="start_time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/game/${gameId}?mode=view`)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
