"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/app/hooks/useSession";
import { getUserPlayerId } from "../utils/playerDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getPlayerStats } from "../utils/playerStats";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerGameStats {
  winRatios: number;
  gamesPlayed: number;
  currentStreak: number;
  initialAverage: number;
  latestAverage: number;
  improvement: number;
}

export default function MyStats() {
  const session = useSession();
  const [playerId, setPlayerId] = useState<string>("");
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
  const [stats, setStats] = useState<PlayerGameStats | null>(null);

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
    async function fetchPlayerStats() {
      if (playerId) {
        const playerStats = await getPlayerStats(playerId);
        if (playerStats) {
          setStats({
            winRatios: playerStats[5].value,
            gamesPlayed: playerStats[0].value,
            currentStreak: playerStats[1].value,
            initialAverage: playerStats[2].value,
            latestAverage: playerStats[3].value,
            improvement: playerStats[4].value
          });
        }
      }
    }
    
    fetchPlayerStats();
  }, [playerId]);

  // Add loading state UI
  if (isLoadingPlayer || !playerId) {
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
      title: "Rating Delta",
      value: `${(stats?.improvement ?? 0) > 0 ? '+' : ''}${stats?.improvement?.toFixed(1) ?? "0.0"}`,
      description: "Change in rating average"
    },
    {
      title: "Latest 3-Game Average",
      value: stats?.latestAverage?.toFixed(1) ?? "0.0",
      description: "Most recent three games average"
    },
    {
      title: "Current Streak",
      value: stats?.currentStreak ?? 0,
      description: "Consecutive games played"
    },
    // {
    //   title: "Games Played",
    //   value: stats?.gamesPlayed ?? 0,
    //   description: "Total games participated"
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