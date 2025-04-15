'use client';
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import dynamic from 'next/dynamic';
import { isEqual } from 'lodash';
import toast from 'react-hot-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { getMostGamesPlayed, getStreakLeader, getMostImproved, getBestPlayer } from "@/app/utils/playerStats";

// Dynamic import of PlayerItem with no SSR
const PlayerItem = dynamic(() => import('./PlayerItem'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
});

type MetricCard = {
  title: string;
  value: string;
  description: string;
};

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
  viewOnly?: boolean; // New prop to disable rating functionality
};

const PlayerListAndStats = forwardRef(({ sessionUserId, groupId, viewOnly = false }: ApprovedPlayersListProps, ref) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MetricCard[]>([]); // Add metrics state
  const [metricsLoading, setMetricsLoading] = useState(true); // Add loading state for metrics
  const previousPlayersRef = useRef<Player[]>([]);
  const isInitialFetchRef = useRef(true);

  // Modify fetchPlayersAndRatings to handle refresh state
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

  // Modify useEffect to remove polling
  useEffect(() => {
    const fetchData = async () => {
      isInitialFetchRef.current = true;
      await fetchPlayersAndRatings();
      // Only calculate metrics after players are loaded
      if (players.length > 0) {
        const newMetrics = await calculateMetrics(players);
        setMetrics(newMetrics);
      }
    };

    fetchData();

    return () => {
      previousPlayersRef.current = [];
      isInitialFetchRef.current = true;
    };
  }, [groupId, players.length]); // Add players.length as dependency

  const calculateMetrics = async (players: Player[]): Promise<MetricCard[]> => {
    try {
      setMetricsLoading(true);
      
      const getBestPlayerMetric = async () => {
        const best = await getBestPlayer();
        return best ? {
          title: "Best Player",
          value: best.name,
          description: `Rating: ${best.value}`
        } : null;
      };

      const getMostGamesPlayedPlayer = async () => {
        const mostGames = await getMostGamesPlayed();
        return mostGames ? {
          title: "Most Games Played",
          value: mostGames.name,
          description: `${mostGames.value} games`
        } : null;
      };

      const getStreakLeaderPlayer = async () => {
        const streakLeader = await getStreakLeader();
        console.log('Streak Leader Data:', streakLeader); // Debug log
        return streakLeader ? {
          title: "Current Streak Leader",
          value: streakLeader.name,
          description: `${streakLeader.value} consecutive games`
        } : null;
      };

      const getMostImprovedPlayer = async () => {
        const mostImproved = await getMostImproved();
        console.log('Most Improved Data:', mostImproved); // Debug log
        return mostImproved ? {
          title: "Most Improved",
          value: mostImproved.name,
          description: `+${mostImproved.value.toFixed(1)} rating gain`
        } : null;
      };

      // Fetch all metrics in parallel
      const [bestPlayer, gamesPlayer, streakLeader, mostImproved] = await Promise.all([
        getBestPlayerMetric(),
        getMostGamesPlayedPlayer(),
        getStreakLeaderPlayer(),
        getMostImprovedPlayer()
      ]);

      // Filter out null values and combine metrics
      const metrics = [bestPlayer, gamesPlayer, streakLeader, mostImproved]
        .filter((metric): metric is MetricCard => metric !== null);
      
      // Debug logging
      console.log('Available players:', players.length);
      console.log('Calculated metrics:', metrics.map(m => ({
        title: m.title,
        value: m.value,
        description: m.description
      })));
      
      return metrics;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return [];
    } finally {
      setMetricsLoading(false);
    }
  };

  // Expose refreshData method
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      await fetchPlayersAndRatings(true);
      const updatedPlayers = previousPlayersRef.current;
      const newMetrics = await calculateMetrics(updatedPlayers);
      setMetrics(newMetrics);
    }
  }));

  return (
    <div className="space-y-4 mt-6">
      {/* Add refresh button */}
     

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricsLoading ? (
          // Loading skeletons for metrics
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="bg-secondary border-secondary">
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => {
            console.log(`Rendering metric ${index}:`, {
              title: metric.title,
              value: metric.value,
              description: metric.description
            });
            
            return (
              <Card key={index} className="bg-secondary border-secondary">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{metric.title}</h3>
                  <p className="text-2xl font-bold text-primary mb-1">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      {viewOnly && (
        <>
      <Card className="bg-secondary border-secondary mx-auto">
      <CardContent className="pt-6">
          <h3 className="font-semibold text-lg">Player Ratings</h3>
          <p className="text-sm text-primary pt-1 mb-1">🔒 This is view only</p> 
      </CardContent>
      </Card>
      </>
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
          onRate={() => {}} // Placeholder for onRate function
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
