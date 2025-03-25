'use client';
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import dynamic from 'next/dynamic';
import { isEqual } from 'lodash';
import toast from 'react-hot-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

// Dynamic import of PlayerItem with no SSR
const PlayerItem = dynamic(() => import('./PlayerItem'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
});

type Rating = {
  rating: number;
  player_id: string;  // Changed from number to string for UUID
  user_id?: string;
};

type Player = {
  id: string;        // Changed from number to string for UUID
  name: string;
  status: string;
  avg_rating: number;
  ratings: Rating[];
};

type ApprovedPlayersListProps = {
  sessionUserId: string;
  groupId: string;
  viewOnly?: boolean; // New prop to disable rating functionality
};

export default function ApprovedPlayersList({ sessionUserId, groupId, viewOnly = false }: ApprovedPlayersListProps) {
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
          status,
          players:players!inner (
            id,
            name,
            status
          )
        `)
        .eq("group_id", groupId);

      if (membershipsError || !memberships) {
        console.error("❌ Error fetching players:", membershipsError);
        if (!isPolling) {
          toast.error("Failed to load players. Please try again later.");
        }
        setPlayers([]);
        return;
      }

      // Extract & filter approved players
      const approvedPlayers: Player[] = memberships
        .filter((m) => m.status === "approved")  
        .flatMap((m) => m.players ?? [])
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
        if (!isPolling) {
          toast.error("Failed to load ratings. Please try again later.");
        }
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
  const handleRate = async (playerId: string, rating: number) => {
    // Check for view-only mode first
    if (viewOnly) {
      toast.error("View-only mode: Ratings cannot be changed");
      return;
    }
    
    try {
      // Prevent rating yourself
      if (playerId === sessionUserId) {
        toast.error("You can't rate yourself!");
        return;
      }

      const loadingToastId = toast.loading("Submitting rating...");
  
      const { error } = await supabase
        .from("ratings")
        .upsert(
          { 
            player_id: playerId,    
            user_id: sessionUserId, 
            rating 
          },
          { onConflict: "player_id, user_id" }
        );
  
      toast.dismiss(loadingToastId);
      
      if (error) {
        console.error("Error submitting rating:", error.message);
        toast.error("Failed to submit rating. Please try again.");
        return;
      }
  
      toast.success("Rating submitted successfully!");
      fetchPlayersAndRatings(true);
    } catch (err) {
      console.error("Failed to submit rating:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {viewOnly && (
      <Card className="bg-secondary border-secondary mx-auto">
        <CardContent className="pt-4">
        <p className="text-primary">🔒 This is view only</p>
        </CardContent>
      </Card>
      )}
      
      <ScrollArea className="h-[65vh]">
      {!loading && players.length === 0 && (
        <Card className="bg-secondary border-secondary">
        <CardContent className="pt-6">
          <p className="text-mutedForeground">No approved players found.</p>
        </CardContent>
        </Card>
      )}
      
      {loading ? (
        <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-secondary border-secondary">
          <CardContent className="h-20" />
          </Card>
        ))}
        </div>
      ) : (
        <div className="space-y-4">
        {players.map((player) => (
          <PlayerItem 
          key={player.id}
          player={player}
          onRate={handleRate} 
          isSelf={player.id === sessionUserId}
          viewOnly={viewOnly}
          />
        ))}
        </div>
      )}
      </ScrollArea>
    </div>
  );
}