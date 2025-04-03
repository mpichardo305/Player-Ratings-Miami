'use client';
import React, { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import dynamic from 'next/dynamic';
import { fetchGamePlayers } from "@/app/utils/playerDb";
import { hasGameEnded } from "@/app/utils/gameUtils";
import toast from "react-hot-toast";

// Dynamic import of PlayerItem with no SSR
const PlayerItem = dynamic(() => import('./PlayerItem'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
});

type Rating = {
  rating: number;
  player_id: string;
  user_id?: string;
};

type Player = {
  id: string;
  name: string;
  status: string;
  avg_rating?: number;
  ratings?: Rating[];
  pendingRating?: number; // To track unsaved ratings
};

type PendingRating = {
  player_id: string;
  rating: number;
};

type UnratedPlayersListProps = {
  playerId: string;
  gameId: string;
};

type Game = {
  id: string;
  date: string;
  start_time: string;
};

export default function UnratedPlayersList({ playerId, gameId }: UnratedPlayersListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isUserPlayer, setIsUserPlayer] = useState<boolean | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isGameEnded, setIsGameEnded] = useState<boolean>(false);
  const [gameLoading, setGameLoading] = useState<boolean>(true);
  // Add a new state to track if the user has already rated players in this game
  const [hasRatedGame, setHasRatedGame] = useState<boolean>(false);

  const fetchPlayersAndRatings = async () => {
    if (!gameId || !playerId) return;
    
    setLoading(true);

    try {
      const gamePlayers = await fetchGamePlayers(gameId);
      
      console.log("Fetched game players:", gamePlayers);
      console.log("Player ID:", playerId);

      // Check if current user is a player in this game using their player ID
      const userIsPlayer = gamePlayers.some(player => player.id === playerId);
      console.log("Is user player:", userIsPlayer);

      setIsUserPlayer(userIsPlayer);

      if (gamePlayers.length === 0) {
        setPlayers([]);
        setIsUserPlayer(false);
        return;
      }

      // Fetch ratings using player ID instead of sessionUserId
      const playerIds = gamePlayers.map((p) => p.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("game_ratings")
        .select("player_id, rating, player_id_rater")
        .in("player_id", playerIds)
        .eq("player_id_rater", playerId); // Changed from sessionUserId to playerId

      if (ratingsError) {
        console.error("❌ Error fetching ratings:", ratingsError);
        setPlayers(gamePlayers);
        return;
      }

      // Check if the user has already rated any players in this game
      if (ratingsData && ratingsData.length > 0) {
        setHasRatedGame(true);
      }

      // Map ratings to players
      const playersWithRatings = gamePlayers.map((player) => {
        const playerRating = ratingsData?.find((r) => r.player_id === player.id);
        return {
          ...player,
          ratings: playerRating ? [playerRating] : [],
        };
      });

      setPlayers(playersWithRatings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayersAndRatings();
  }, [gameId, playerId]);

  // Fetch game data to check if it has ended
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      
      setGameLoading(true);
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        const data = await response.json();
        setGame(data);
        
        // Check if game has ended
        const gameHasEnded = hasGameEnded(data.date, data.start_time);
        setIsGameEnded(gameHasEnded);
      } catch (error) {
        console.error('Error fetching game:', error);
      } finally {
        setGameLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Function to store a rating in pending state
  const handleRate = (playerIdToRate: string, rating: number) => {
    // Prevent rating yourself
    if (playerIdToRate === playerId) { 
      console.warn("🚫 You can't rate yourself!");
      toast.error("You cannot rate your own performance!");
      return;
    }
    
    // Update the pending ratings
    setPendingRatings(prev => {
      // Find if we already have a pending rating for this player
      const existingIndex = prev.findIndex(pr => pr.player_id === playerIdToRate);
      
      if (existingIndex >= 0) {
        // Update existing rating
        const updated = [...prev];
        updated[existingIndex].rating = rating;
        return updated;
      } else {
        // Add new rating
        return [...prev, { player_id: playerIdToRate, rating }];
      }
    });
    
    // Also update the UI to show the pending rating
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerIdToRate 
          ? { ...player, pendingRating: rating } 
          : player
      )
    );
    
    // Clear any previous submit messages
    setSubmitMessage(null);
  };
  
  // Function to submit all pending ratings at once
  const handleSubmitRatings = async () => {
    if (pendingRatings.length === 0) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'No ratings to submit. Please rate at least one player.' 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the ratings for batch insert
      const ratingsToSubmit = pendingRatings.map(pr => ({
        player_id: pr.player_id,
        player_id_rater: playerId, // rater's player ID
        rating: pr.rating,
        game_id: gameId
      }));
      
      // Submit all ratings to game_ratings table
      const { error } = await supabase
        .from("game_ratings") // Using "game_ratings" correctly
        .upsert(ratingsToSubmit, { 
          onConflict: "player_id_rater, player_id, game_id"
        }); 
      
      if (error) {
        console.error("Error submitting ratings:", error.message);
        setSubmitMessage({ type: 'error', text: `Failed to submit: ${error.message}` });
        return;
      }
      
      // Clear pending ratings after successful submission
      setPendingRatings([]);
      setSubmitMessage({ type: 'success', text: 'All ratings submitted successfully!' });
      
      // Refresh the player data
      fetchPlayersAndRatings();
      
    } catch (err) {
      console.error("Failed to submit ratings:", err);
      setSubmitMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count how many players have pending ratings
  const pendingRatingsCount = pendingRatings.length;
  
  // Determine if submit button should be disabled
  const isSubmitDisabled = isSubmitting || 
                          pendingRatings.length === 0 || 
                          isUserPlayer === false ||
                          !isGameEnded;

  return (
    <div className="space-y-4">
      {/* Add alert for users who already rated players in this game */}
      {hasRatedGame && (
        <div className="mb-4 p-3 rounded bg-blue-600 text-white">
          You already submitted a rating for this game.
        </div>
      )}

      {/* Show warning if game hasn't ended yet */}
      {!isGameEnded && !gameLoading && (
        <div className="mb-4 p-3 rounded bg-red-600 text-white">
          This game hasn't ended yet. Ratings can only be submitted after the game has finished.
        </div>
      )}
      
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pb-6">
        {!loading && players.length === 0 && (
          <p className="text-gray-400">No players found for this game.</p>
        )}

        {loading && (
          <div data-testid="loading-skeleton" className="space-y-4">
            {/* Your existing skeleton markup */}
          </div>
        )}

        {loading ? (
          // Show loading skeletons
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : (
          // Show actual players
          players.map((player) => {
            const isSelf = player.id === playerId;
            const userRating = player.ratings?.find(r => r.user_id === playerId)?.rating;
            const pendingRating = player.pendingRating;
            
            return (
              <div key={player.id} className="player-item relative mb-4">
                {pendingRating && (
                  <div className="absolute -right-2 -top-2 bg-yellow-500 text-xs text-black font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ⏳
                  </div>
                )}
                <PlayerItem 
                  player={{
                    ...player,
                    // Show the user's previous rating if it exists, otherwise use 0
                    avg_rating: userRating || 0,
                    ratings: player.ratings ? player.ratings.map(r => ({ 
                      rating: r.rating, 
                      user_id: r.user_id 
                    })) : []
                  }}
                  onRate={handleRate} 
                  isSelf={isSelf}
                  pendingRating={pendingRating}
                />
                {userRating && !pendingRating && (
                  <p className="text-blue-400 text-xs mt-1">Your previous rating: {userRating}</p>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Submit button and status message */}
      <div className="mt-8 border-t border-gray-700 pt-4">
        {isUserPlayer === false && (
          <div className="mb-4 p-3 rounded bg-amber-600 text-white">
            You must be a player in this game to submit ratings.
          </div>
        )}
        
        {!isGameEnded && !gameLoading && (
          <div className="mb-4 p-3 rounded bg-amber-600 text-white">
            Ratings can only be submitted after the game has ended.
          </div>
        )}
        
        {submitMessage && (
          <div className={`mb-4 p-3 rounded ${
            submitMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {submitMessage.text}
          </div>
        )}
        
        <button
          onClick={handleSubmitRatings}
          disabled={isSubmitDisabled}
          className={`w-full py-3 rounded-lg font-medium ${
            !isSubmitDisabled
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          } transition-all`}
        >
          {isSubmitting 
            ? 'Submitting...' 
            : !isGameEnded 
              ? 'Game Has Not Ended Yet'
              : isUserPlayer === false
                ? 'Only Players Can Rate'
                : pendingRatingsCount > 0
                  ? `${hasRatedGame ? 'Update' : 'Submit'} ${pendingRatingsCount} Rating${pendingRatingsCount !== 1 ? 's' : ''}`
                  : 'No Ratings to Submit'
          }
        </button>
      </div>
    </div>
  );
}
