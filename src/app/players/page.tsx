"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import { useGroup } from "@/app/context/GroupContext";
import { Button } from "@/components/ui/button";
import PlayerListAndStats from "../components/PlayerList";
import { usePlayerId } from "../hooks/usePlayerId";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const { playerId, loading: loadingPlayer } = usePlayerId();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const { isCurrentGroupAdmin } = useGroup();
  const groupStatsRef = useRef<any>(null);

  const handleRefresh = async () => {
    if (!groupStatsRef.current) return;
    
    setRefreshing(true);
    try {
      await groupStatsRef.current.refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  if (!session?.user || loadingPlayer) {
    return <div>Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg- p-4 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold pt-2 pb-2 text-white">Players</h1>
        
        <GroupSelector   playerId={playerId} onGroupSelect={setSelectedGroup} hideEditIcon={true}/>
      </div>

      {selectedGroup ? (
        <div className="space-y-4">
          {session && isCurrentGroupAdmin && (
            <>
              <div className="flex gap-6">
              </div>
              <div>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  variant="default"
                  className="w-full md:w-auto"
                >
                  Show Pending Players
                </Button>
              </div>
            </>
          )}

          {showApproveDialog && selectedGroup && (
            <ApprovePlayersDialog 
              onClose={() => setShowApproveDialog(false)} 
              onApprove={() => {}}
              groupId={selectedGroup.id}
              isGroupAdmin={isCurrentGroupAdmin}
            />
          )}
          <PlayerListAndStats
            ref={groupStatsRef}
            sessionUserId={session.user.id} 
            groupId={selectedGroup.id} 
            viewOnly={true} 
            onRefresh={handleRefresh}
            isRefreshing={refreshing}
          />
        </div>
      ) : (
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}