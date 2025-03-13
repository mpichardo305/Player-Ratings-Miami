'use client';
import React, { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import dynamic from 'next/dynamic';
import { fetchGamePlayers } from "@/app/utils/playerDb";
import { hasGameEnded } from "@/app/utils/gameUtils";

// Dynamic import of PlayerItem with no SSR
const PlayerItem = dynamic(() => import('./PlayerItem'), { 
  ssr: false,
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
  sessionUserId: string;
  gameId: string;
};

export default function UnratedPlayersList({ sessionUserId, gameId }: UnratedPlayersListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isUserPlayer, setIsUserPlayer] = useState<boolean | null>(null);

  const fetchPlayersAndRatings = async () => {
    if (!gameId) return;
    
    setLoading(true);

    try {
      // Use fetchGamePlayers to get players for this game
      const gamePlayers = await fetchGamePlayers(gameId);
      
      if (gamePlayers.length === 0) {
        setPlayers([]);
        setIsUserPlayer(false);
        return;
      }

      // Check if current user is a player in this game
      const userIsPlayer = gamePlayers.some(player => player.id === sessionUserId);
      setIsUserPlayer(userIsPlayer);

      // Fetch ratings for these players to check if current user has already rated them
      const playerIds = gamePlayers.map((p) => p.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("player_id, rating, user_id")
        .in("player_id", playerIds)
        .eq("user_id", sessionUserId);

      if (ratingsError) {
        console.error("❌ Error fetching ratings:", ratingsError);
        setPlayers(gamePlayers);
        return;
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
  }, [gameId]);

  // Function to store a rating in pending state
  const handleRate = (playerId: string, rating: number) => {
    // Prevent rating yourself
    if (playerId === sessionUserId) {
      console.warn("🚫 You can't rate yourself!");
      return;
    }
    
    // Update the pending ratings
    setPendingRatings(prev => {
      // Find if we already have a pending rating for this player
      const existingIndex = prev.findIndex(pr => pr.player_id === playerId);
      
      if (existingIndex >= 0) {
        // Update existing rating
        const updated = [...prev];
        updated[existingIndex].rating = rating;
        return updated;
      } else {
        // Add new rating
        return [...prev, { player_id: playerId, rating }];
      }
    });
    
    // Also update the UI to show the pending rating
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId 
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
        user_id: sessionUserId,
        rating: pr.rating,
        game_id: gameId
      }));
      
      // Submit all ratings in one call
      const { error } = await supabase
        .from("game_ratings")
        .upsert(ratingsToSubmit, { onConflict: "player_id, user_id" });
      
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
                          isUserPlayer === false;

  return (
    <div className="space-y-4">
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pb-6">
        {!loading && players.length === 0 && (
          <p className="text-gray-400">No players found for this game.</p>
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
            const isSelf = player.id === sessionUserId;
            const userRating = player.ratings?.find(r => r.user_id === sessionUserId)?.rating;
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
                    avg_rating: pendingRating || userRating || 0,
                    ratings: player.ratings ? player.ratings.map(r => ({ 
                      rating: r.rating, 
                      user_id: r.user_id 
                    })) : []
                  }}
                  onRate={handleRate} 
                  isSelf={isSelf}
                />
                {isSelf && <p className="text-gray-400">🚫 You can not rate yourself!</p>}
                {pendingRating && <p className="text-yellow-400 text-xs mt-1">Rating pending submission</p>}
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
            : isUserPlayer === false
              ? 'Only Players Can Rate'
              : pendingRatingsCount > 0
                ? `Submit ${pendingRatingsCount} Rating${pendingRatingsCount !== 1 ? 's' : ''}`
                : 'No Ratings to Submit'
          }
        </button>
      </div>
    </div>
  );
}
