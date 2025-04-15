'use client';
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
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
  player_id: string;
  user_id?: string;
};

type Player = {
  id: string;
  name: string;
  status: string;
  avg_rating: number;
  ratings: Rating[];
};

type ApprovedPlayersListProps = {
  sessionUserId: string;
  groupId: string;
  viewOnly?: boolean;
};

const PlayerListAndStats = forwardRef(({ sessionUserId, groupId, viewOnly = false }: ApprovedPlayersListProps, ref) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const previousPlayersRef = useRef<Player[]>([]);
  const isInitialFetchRef = useRef(true);

  const fetchPlayersAndRatings = async (isRefresh = false) => {
    if (!groupId) return;
    
    if (isInitialFetchRef.current || isRefresh) {
      isRefresh ? setRefreshing(true) : setLoading(true);
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
        if (!isRefresh) {
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
        .from("game_ratings")
        .select("player_id, rating")
        .in("player_id", playerIds);

      if (ratingsError) {
        console.error("❌ Error fetching ratings:", ratingsError, JSON.stringify(ratingsError, null, 2));
        if (!isRefresh) {
          toast.error("Failed to load ratings. Please try again later.");
        }
        setPlayers(approvedPlayers);
        return;
      }

      // Merge ratings into players
      const playersWithRatings = approvedPlayers.reverse().map((player) => {
        const playerRatings = ratingsData?.filter((r) => r.player_id === player.id) || [];
        const sum = playerRatings.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = playerRatings.length > 0 ? Math.round((sum / playerRatings.length) * 2) / 2 : 0;

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
      if (isInitialFetchRef.current) {
        setLoading(false);
        isInitialFetchRef.current = false;
      }
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      isInitialFetchRef.current = true;
      await fetchPlayersAndRatings();
    };

    fetchData();

    return () => {
      previousPlayersRef.current = [];
      isInitialFetchRef.current = true;
    };
  }, [groupId]);

  useImperativeHandle(ref, () => ({
    refreshData: () => fetchPlayersAndRatings(true)
  }));

  return (
    <div className="space-y-4 mt-6">
      {viewOnly && (
        <Card className="bg-secondary border-secondary mx-auto">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg">Player Ratings</h3>
            <p className="text-sm text-primary pt-1 mb-1">🔒 This is view only</p> 
          </CardContent>
        </Card>
      )}
      
      <ScrollArea className="h-[calc(100vh-300px)] rounded-md border border-secondary p-4">
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
                onRate={() => {}}
                isSelf={player.id === sessionUserId}
                viewOnly={viewOnly}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

export default PlayerListAndStats;
