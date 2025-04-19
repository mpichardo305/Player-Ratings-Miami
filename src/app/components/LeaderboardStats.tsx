'use client';
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MoveRight, Flame, TrendingUp, Repeat } from "lucide-react";

type MetricData = {
  title: string;
  value: string;
  description: string;
  iconType: 'trophy' | 'flame' | 'moveRight' | 'trendingUp' | 'repeat';
};

type MetricCard = {
  title: string;
  value: string;
  description: string;
  icon: React.JSX.Element;
};

type LeaderboardStatsProps = {
  groupId: string;
};

const getIconForType = (iconType: MetricData['iconType']): React.JSX.Element => {
  switch (iconType) {
    case 'trophy':
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 'flame':
      return <Flame className="w-5 h-5 text-orange-500" />;
    case 'moveRight':
      return <MoveRight className="w-5 h-5 text-blue-500" />;
    case 'trendingUp':
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    case 'repeat':
      return <Repeat className="w-5 h-5 text-orange-500" />;
  }
};

const convertToMetricCard = (data: MetricData): MetricCard => ({
  ...data,
  icon: getIconForType(data.iconType)
});

const getCachedMetric = (key: string, groupId: string) => {
  if (!groupId) return null; // Don't use cache if no groupId

  const cacheKey = `metric_${groupId}_${key}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp, cachedGroupId } = JSON.parse(cached);
    // Only use cache if:
    // 1. Less than 5 minutes old
    // 2. Matches current groupId exactly
    if (Date.now() - timestamp < 5 * 60 * 1000 && cachedGroupId === groupId) {
      return data;
    } else {
      // Clear expired or mismatched cache
      localStorage.removeItem(cacheKey);
    }
  }
  return null;
};

const cacheMetric = (key: string, groupId: string, data: any) => {
  if (!groupId) return; // Don't cache if no groupId

  const cacheKey = `metric_${groupId}_${key}`;
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now(),
    cachedGroupId: groupId // Store groupId with cache
  }));
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

const LeaderboardStats: React.FC<LeaderboardStatsProps> = ({ groupId }) => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const previousGroupId = useRef<string>(groupId);

  useEffect(() => {
    const updateMetrics = async () => {
      if (previousGroupId.current !== groupId) {
        // Clear old group's cache first
        clearGroupCache(previousGroupId.current);
        setMetrics([]); // Clear current metrics
        setMetricsLoading(true);
        previousGroupId.current = groupId;
      }
      
      // Calculate new metrics for current group
      const newMetrics = await calculateMetrics();
      setMetrics(newMetrics);
    };

    updateMetrics();
  }, [groupId]); // Only depend on groupId changes

  useEffect(() => {
    // Cleanup function
    return () => {
      if (previousGroupId.current) {
        clearGroupCache(previousGroupId.current);
      }
    };
  }, []); // Empty dependency array for cleanup

  const calculateMetrics = async (): Promise<MetricCard[]> => {
    try {
      setMetricsLoading(true);
      
      // Define all metric fetchers
      const metricFetchers = {
        bestPlayer: getBestPlayerMetric,
        longestWinStreak: getLongestWinStreakPlayer,
        mostGames: getMostGamesPlayedPlayer,
        mostImproved: getMostImprovedPlayer,
        streakLeader: getStreakLeaderPlayer
      };

      // Check cache first for all metrics
      const cachedMetrics = Object.entries(metricFetchers).map(([key, _]) => {
        return getCachedMetric(key, groupId);
      });

      // If all metrics are cached, use them
      if (cachedMetrics.every(metric => metric !== null)) {
        return cachedMetrics
          .map(metric => metric && convertToMetricCard(metric))
          .filter((metric): metric is MetricCard => metric !== null);
      }

      // Otherwise fetch all metrics
      console.log('Starting metrics calculation...');
      
      const results = await Promise.all([
        measureTime('Best Player', getBestPlayerMetric),
        measureTime('Longest Win Streak', getLongestWinStreakPlayer),
        measureTime('Most Games Played', getMostGamesPlayedPlayer),
        measureTime('Most Improved', getMostImprovedPlayer),
        measureTime('Streak Leader', getStreakLeaderPlayer)
      ]);

      console.log('All metrics calculated');

      return results.filter((metric): metric is MetricCard => metric !== null);

    } catch (error) {
      console.error('Error calculating metrics:', error);
      return [];
    } finally {
      setMetricsLoading(false);
    }
  };

  const measureTime = async (name: string, fn: () => Promise<MetricCard | null>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms to calculate`);
    return result;
  };

  const getBestPlayerMetric = async () => {
    try {
      // Include groupId in the cache key
      const cached = getCachedMetric('bestPlayer', groupId);
      if (cached) {
        console.log(`Using cached best player for group ${groupId}:`, cached);
        return convertToMetricCard(cached);
      }

      const response = await fetch(`/api/stats/best-player?groupId=${groupId}`);
      const best = await response.json();
      
      if (!best) return null;

      const metricData: MetricData = {
        title: "Best Player",
        value: best.name,
        description: `Rating: ${best.value}`,
        iconType: 'trophy'
      };

      // Cache with groupId
      cacheMetric('bestPlayer', groupId, metricData);
      return convertToMetricCard(metricData);
    } catch (error) {
      console.error('Error fetching best player:', error);
      return null;
    }
  };

  const getMostGamesPlayedPlayer = async () => {
    try {
      const cached = getCachedMetric('mostGames', groupId);
      if (cached) return convertToMetricCard(cached);

      const response = await fetch(`/api/stats/most-games?groupId=${groupId}`);
      const mostGames = await response.json();
      
      if (!mostGames) return null;

      const metricData: MetricData = {
        title: "Most Games Played",
        value: mostGames.name,
        description: `${mostGames.value} ${mostGames.value === 1 ? 'game' : 'games'}`,
        iconType: 'moveRight'
      };

      cacheMetric('mostGames', groupId, metricData);
      return convertToMetricCard(metricData);
    } catch (error) {
      console.error('Error fetching most games played:', error);
      return null;
    }
  };

  const getStreakLeaderPlayer = async () => {
    try {
      // Include groupId in cache check
      const cached = getCachedMetric('streakLeader', groupId);
      if (cached) {
        console.log(`Using cached streak leader for group ${groupId}:`, cached);
        return convertToMetricCard(cached);
      }

      console.log(`Fetching new streak leader data for group ${groupId}...`);
      const response = await fetch(`/api/stats/streak-leader?groupId=${groupId}`);
      const streakLeader = await response.json();
      
      if (!streakLeader) {
        console.log(`No streak leader found for group ${groupId}`);
        return null;
      }

      const metricData: MetricData = {
        title: "Consecutive Games Streak Leader",
        value: streakLeader.name,
        description: `${streakLeader.value} consecutive games`,
        iconType: 'repeat'
      };

      // Cache with groupId
      cacheMetric('streakLeader', groupId, metricData);
      return convertToMetricCard(metricData);
    } catch (error) {
      console.error(`Error fetching streak leader for group ${groupId}:`, error);
      return null;
    }
  };

  const getMostImprovedPlayer = async () => {
    try {
      // Include groupId in cache check
      const cached = getCachedMetric('mostImproved', groupId);
      if (cached) {
        console.log(`Using cached most improved player for group ${groupId}:`, cached);
        return convertToMetricCard(cached);
      }

      console.log(`Fetching new most improved data for group ${groupId}...`);
      const response = await fetch(`/api/stats/most-improved?groupId=${groupId}`);
      const mostImproved = await response.json();
      
      if (!mostImproved) {
        console.log(`No most improved player found for group ${groupId}`);
        return null;
      }

      const metricData: MetricData = {
        title: "Most Improved",
        value: mostImproved.name,
        description: `+${mostImproved.value.toFixed(1)} rating gain`,
        iconType: 'trendingUp'
      };

      // Cache with groupId
      cacheMetric('mostImproved', groupId, metricData);
      return convertToMetricCard(metricData);
    } catch (error) {
      console.error(`Error fetching most improved player for group ${groupId}:`, error);
      return null;
    }
  };

  const getLongestWinStreakPlayer = async () => {
    try {
      const cached = getCachedMetric('longestWinStreak', groupId);
      if (cached) {
        console.log('Using cached win streak data:', cached);
        return convertToMetricCard(cached);
      }

      console.log('Fetching new win streak data...');
      const response = await fetch(`/api/stats/longest-win-streak?groupId=${groupId}`);
      const winStreakLeader = await response.json();
      
      console.log('Win streak API response:', winStreakLeader);
      
      if (!winStreakLeader) {
        console.log('No win streak leader found');
        return null;
      }

      const metricData: MetricData = {
        title: "Longest Win Streak",
        value: winStreakLeader.name,
        description: `${winStreakLeader.value} consecutive ${winStreakLeader.value === 1 ? 'win' : 'wins'}`,
        iconType: 'flame'
      };

      cacheMetric('longestWinStreak', groupId, metricData);
      return convertToMetricCard(metricData);
    } catch (error) {
      console.error('Error fetching longest win streak:', error);
      return null;
    }
  };

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