'use client';
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MoveRight, Flame, TrendingUp, Repeat } from "lucide-react";

type MetricCard = {
  title: string;
  value: string;
  description: string;
  icon: React.JSX.Element;
};

const LeaderboardStats = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const calculateMetrics = async (): Promise<MetricCard[]> => {
    try {
      setMetricsLoading(true);
      
      const getBestPlayerMetric = async () => {
        const response = await fetch('/api/stats/best-player');
        const best = await response.json();
        return best ? {
          title: "Best Player",
          value: best.name,
          description: `Rating: ${best.value}`,
          icon: <Trophy className="w-5 h-5 text-yellow-500" />
        } : null;
      };

      const getMostGamesPlayedPlayer = async () => {
        const response = await fetch('/api/stats/most-games');
        const mostGames = await response.json();
        return mostGames ? {
          title: "Most Games Played",
          value: mostGames.name,
          description: `${mostGames.value} games`,
          icon: <MoveRight className="w-5 h-5 text-blue-500" />
        } : null;
      };

      const getStreakLeaderPlayer = async () => {
        const response = await fetch('/api/stats/streak-leader');
        const streakLeader = await response.json();
        return streakLeader ? {
          title: "Consecutive Games Streak Leader",
          value: streakLeader.name,
          description: `${streakLeader.value} consecutive games`,
          icon: <Repeat className="w-5 h-5 text-orange-500" />
        } : null;
      };

      const getMostImprovedPlayer = async () => {
        const response = await fetch('/api/stats/most-improved');
        const mostImproved = await response.json();
        return mostImproved ? {
          title: "Most Improved",
          value: mostImproved.name,
          description: `+${mostImproved.value.toFixed(1)} rating gain`,
          icon: <TrendingUp className="w-5 h-5 text-green-500" />
        } : null;
      };

      const getLongestWinStreakPlayer = async () => {
        try {
          const response = await fetch('/api/stats/longest-win-streak');
          const winStreakLeader = await response.json();
          
          return winStreakLeader ? {
            title: "Longest Win Streak",
            value: winStreakLeader.name,
            description: `${winStreakLeader.value} consecutive wins`,
            icon: <Flame className="w-5 h-5 text-orange-500" />
          } : null;
        } catch (error) {
          console.error('Error fetching longest win streak:', error);
          return null;
        }
      };

      const [bestPlayer, longestWinStreak, gamesPlayer, mostImproved, streakLeader] = await Promise.all([
        getBestPlayerMetric(),
        getLongestWinStreakPlayer(),
        getMostGamesPlayedPlayer(),
        getMostImprovedPlayer(),
        getStreakLeaderPlayer()
      ]);

      return [bestPlayer, longestWinStreak, gamesPlayer, mostImproved, streakLeader]
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

  const renderMetricCard = (metric: MetricCard, index: number) => (
    <Card key={index} className="bg-secondary border-secondary">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          {metric.icon}
          <h3 className="font-semibold text-lg">{metric.title}</h3>
        </div>
        <p className="text-2xl font-bold text-primary mb-1">{metric.value}</p>
        <p className="text-sm text-muted-foreground">{metric.description}</p>
      </CardContent>
    </Card>
  );

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
          metrics.map((metric, index) => renderMetricCard(metric, index))
        )}
      </div>
    </div>
  );
};

export default LeaderboardStats;