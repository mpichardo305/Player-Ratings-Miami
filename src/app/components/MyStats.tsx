"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/app/hooks/useSession";
import { getUserPlayerId } from "../utils/playerDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getPlayerStats } from "../utils/playerStats";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerGameStats {
  winRatios: number;
  gamesPlayed: number;
  strictCurrentStreak: number;
  initialAverage: number;
  latestAverage: number;
  improvement: number;
  totalWins: number;  
  winStreak: number;  
}
type MyStatsProps = {
  groupId: string;
};

// Add a function to clear cache for a specific group
const clearGroupCache = (groupId: string) => {
  if (!groupId) return; // Don't clear if no groupId

  console.log(`Clearing cache for group ${groupId}`);
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(`metric_${groupId}_`)) {
      console.log(`Removing cache key: ${key}`);
      localStorage.removeItem(key);
    }
  });
};

const MyStats: React.FC<MyStatsProps> = ({ groupId }) => {
  const session = useSession();
  const [playerId, setPlayerId] = useState<string>("");
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState<PlayerGameStats | null>(null);
  const previousGroupId = useRef<string>(groupId);

  useEffect(() => {
    async function fetchPlayerId() {
      if (session?.user?.id) {
        setIsLoadingPlayer(true);
        const id = await getUserPlayerId(session.user.id);
        setPlayerId(id ?? "");
        setIsLoadingPlayer(false);
      }
    }
    fetchPlayerId();
  }, [session?.user?.id]);
  
  useEffect(() => {
    return () => {
      if (previousGroupId.current) {
        clearGroupCache(previousGroupId.current);
      }
    };
  }, []); // Empty dependency array for cleanup

  useEffect(() => {
    async function fetchPlayerStats() {
      if (!playerId) return;
      setIsLoadingStats(true);
      const playerStats = await getPlayerStats(playerId, groupId);
      if (playerStats) {
        setStats({
          winRatios: playerStats[6].value,      // Win Ratio is now at index 6
          gamesPlayed: playerStats[0].value,     // Games Played
          totalWins: playerStats[1].value,       // Total Wins
          strictCurrentStreak: playerStats[8].value,   // Strict Current Streak
          initialAverage: playerStats[3].value,  // Initial Average
          latestAverage: playerStats[4].value,   // Latest Average
          improvement: playerStats[5].value,     // Rating Improvement
          winStreak: playerStats[7].value        // Win Streak (new)
        });
      }
      setIsLoadingStats(false);
    }
    
    fetchPlayerStats();
  }, [playerId, groupId]);

  // Add loading state UI
  if (isLoadingPlayer || !playerId || isLoadingStats) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading stats...</span>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Win Ratio",
      value: `${(stats?.winRatios ?? 0).toFixed(1)}%`,
      description: "Games won out of total games played"
    },
    {
      title: "Win Streak",
      value: stats?.winStreak ?? 0,
      description: "Current consecutive wins"
    },
    {
      title: "Latest 3-Game Average",
      value: stats?.latestAverage?.toFixed(1) ?? "0.0",
      description: "Most recent three games average"
    },
    {
      title: "Consecutive Game Streak",
      value: stats?.strictCurrentStreak ?? 0,
      description: "Total number of consecutive participated games"
    }
    // {
    //   title: "Total Games Played",
    //   value: stats?.gamesPlayed ?? 0,
    //   description: "Total number of participated games"
    // },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-1xl">My Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md">
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat, index) => (
                <Card key={index} className="bg-secondary border-secondary">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
export default MyStats;