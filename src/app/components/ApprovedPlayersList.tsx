'use client';
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import dynamic from 'next/dynamic';
import { isEqual } from 'lodash';

// Dynamic import of PlayerItem with no SSR
const PlayerItem = dynamic(() => import('./PlayerItem'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
});

type Rating = {
  rating: number;
  player_id: number;
  user_id?: string;
};

type Player = {
  id: number;
  name: string;
  status: string;
  avg_rating: number;
  ratings: Rating[];
};

type ApprovedPlayersListProps = {
  sessionUserId: string;
  groupId: string;
};

export default function ApprovedPlayersList({ sessionUserId, groupId }: ApprovedPlayersListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const previousPlayersRef = useRef<Player[]>([]);
  const isInitialFetchRef = useRef(true);

  const fetchPlayersAndRatings = async (isPolling = false) => {
    if (!groupId) return;
    
    // Only set loading on initial fetch
    if (!isPolling) {
      setLoading(true);
    }

    try {
      // Fetch all memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_memberships")
        .select(`
          players:players!inner (
            id,
            name,
            status
          )
        `)
        .eq("group_id", groupId);

      if (membershipsError || !memberships) {
        console.error("❌ Error fetching players:", membershipsError);
        setPlayers([]);
        return;
      }

      // Extract & filter approved players
      const approvedPlayers: Player[] = memberships
        .flatMap((m) => m.players ?? [])
        .filter((pl) => pl.status === "approved")
        .map((pl) => ({
          ...pl,
          avg_rating: 0,
          ratings: [],
        }));

      if (approvedPlayers.length === 0) {
        setPlayers([]);
        return;
      }

      // Fetch ratings for these players
      const playerIds = approvedPlayers.map((p) => p.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("player_id, rating, user_id")
        .in("player_id", playerIds);

      if (ratingsError) {
        console.error("❌ Error fetching ratings:", ratingsError, JSON.stringify(ratingsError, null, 2));
        setPlayers(approvedPlayers);
        return;
      }

      // Merge ratings into players
      const playersWithRatings = approvedPlayers.reverse().map((player) => {
        const playerRatings = ratingsData?.filter((r) => r.player_id === player.id) || [];
        const sum = playerRatings.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = playerRatings.length > 0 ? Math.ceil(sum / playerRatings.length) : 0;

        return {
          ...player,
          ratings: playerRatings,
          avg_rating: avg,
        };
      });

      // Only update state if the data has actually changed
      if (!isEqual(playersWithRatings, previousPlayersRef.current)) {
        previousPlayersRef.current = playersWithRatings;
        setPlayers(playersWithRatings);
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
      // Mark initial fetch as complete
      isInitialFetchRef.current = false;
    }
  };

  useEffect(() => {
    // Reset initial fetch flag when groupId changes
    isInitialFetchRef.current = true;
    
    // Initial fetch
    fetchPlayersAndRatings(false);

    // Set up polling
    const interval = setInterval(() => {
      fetchPlayersAndRatings(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      previousPlayersRef.current = [];
      isInitialFetchRef.current = true;
    };
  }, [groupId]);

  // Function to upsert a rating
  const handleRate = async (playerId: number, rating: number) => {
    console.log("playerId", playerId)
    // Prevent rating yourself if needed
    if (playerId === parseInt(sessionUserId)) {
      console.warn("🚫 You can't rate yourself!");
      return;
    }

    // Upsert with composite conflict (player_id, user_id)
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { player_id: playerId, user_id: sessionUserId, rating },
        { onConflict: "player_id, user_id" }
      );

    if (error) {
      console.error("❌ Error upserting rating:", error);
    } else {
      console.log("✅ Rating submitted successfully!");
      // Refresh data immediately without showing loading state
      fetchPlayersAndRatings(true);
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
      {!loading && players.length === 0 && (
        <p className="text-gray-400">No approved players found.</p>
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
          const isSelf = player.id === parseInt(sessionUserId);
          return (
            <div key={player.id} className="player-item">
              <PlayerItem player={player} onRate={handleRate} isSelf={isSelf}/>
              {isSelf && <p className="text-gray-400">🚫 You can not rate yourself!</p>}
            </div>
          );
        })
      )}
    </div>
  );
}