"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import { getUserPlayerId } from "@/app/utils/playerDb";
import LeaderboardStats from '@/app/components/LeaderboardStats';
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { usePlayerId } from "../hooks/usePlayerId";

export default function LeaderboardPage() {
  const session = useSession();
  const { playerId, loading: loadingPlayer } = usePlayerId();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);

  const handleGroupChange = (group: Group) => {
    console.log('Group changed:', group);
    setSelectedGroup(group);
    // Add any additional logic needed when group changes
    localStorage.removeItem('leaderboardCache'); // Clear any cached data
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!session?.user || !isClient || loadingPlayer || !playerId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-[300px]">
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin" />
              <span className="mt-4">Loading stats...</span>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg- p-4 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold pt-2 pb-2 text-white">Leaderboard</h1>
        
        <GroupSelector 
          playerId={playerId} 
          onGroupSelect={handleGroupChange} 
          hideEditIcon={true}
        />
      </div>

      {selectedGroup ? (
        // Add a key that forces remount when group changes
        <LeaderboardStats 
          key={`leaderboard-${selectedGroup.id}`} // Changed this line
          groupId={selectedGroup.id}
          onGroupChange={(groupId) => {
            // Add any additional group change handling here
            console.log('LeaderboardStats group changed to:', groupId);
          }}
        />
      ) : (
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}