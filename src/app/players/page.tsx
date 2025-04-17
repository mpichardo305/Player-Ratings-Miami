"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovedPlayersList from "@/app/components/ApprovedPlayersList";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { Button } from "@/components/ui/button";
import GroupStats from "../components/PlayerList";
import { RefreshCw } from "lucide-react";
import PlayerListAndStats from "../components/PlayerList";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', selectedGroup?.id ?? '');
  const [viewOnly, setViewOnly] = useState(false);
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

  if (!session?.user) {
    return <div>Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg- p-4 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold pt-2 pb-2 text-white">Players</h1>
        
        <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} hideEditIcon={true}/>
      </div>

      {selectedGroup ? (
        <div className="space-y-4">
          {session && isGroupAdmin && (
            <>
              <div className="flex gap-6">
                {/* ... existing code ... */}
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
              isGroupAdmin={true}
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