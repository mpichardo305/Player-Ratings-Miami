"use client";

import { useState } from "react";
import { useSession } from "@/app/hooks/useSession";
import LeaderboardStats from '@/app/components/LeaderboardStats';
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LeaderboardPage() {
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  if (!session?.user) {
      return (
        <Card>
          <CardContent className="pt-6 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading stats...</span>
          </CardContent>
        </Card>
      );
  }

  return (
    <div className="min-h-screen bg- p-4 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold pt-2 pb-2 text-white">Leaderboard</h1>
        
        <GroupSelector 
          sessionUserId={session.user.id} 
          onGroupSelect={setSelectedGroup} 
          hideEditIcon={true}
        />
      </div>

      {selectedGroup ? (
        <LeaderboardStats />
      ) : (
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}