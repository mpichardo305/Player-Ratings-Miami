'use client';
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getMostGamesPlayed, getStreakLeader, getMostImproved, getBestPlayer } from "@/app/utils/playerStats";

type MetricCard = {
  title: string;
  value: string;
  description: string;
};

const LeaderboardStats = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const calculateMetrics = async (): Promise<MetricCard[]> => {
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
        return streakLeader ? {
          title: "Current Streak Leader",
          value: streakLeader.name,
          description: `${streakLeader.value} consecutive games`
        } : null;
      };

      const getMostImprovedPlayer = async () => {
        const mostImproved = await getMostImproved();
        return mostImproved ? {
          title: "Most Improved",
          value: mostImproved.name,
          description: `+${mostImproved.value.toFixed(1)} rating gain`
        } : null;
      };

      const [bestPlayer, gamesPlayer, streakLeader, mostImproved] = await Promise.all([
        getBestPlayerMetric(),
        getMostGamesPlayedPlayer(),
        getStreakLeaderPlayer(),
        getMostImprovedPlayer()
      ]);

      return [bestPlayer, gamesPlayer, streakLeader, mostImproved]
        .filter((metric): metric is MetricCard => metric !== null);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return [];
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    calculateMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricsLoading ? (
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
          metrics.map((metric, index) => (
            <Card key={index} className="bg-secondary border-secondary">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">{metric.title}</h3>
                <p className="text-2xl font-bold text-primary mb-1">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardStats;