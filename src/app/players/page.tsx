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
import GroupStats from "../components/PlayerListAndStats";
import { RefreshCw } from "lucide-react";
import PlayerListAndStats from "../components/PlayerListAndStats";

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
        <h1 className="text-3xl font-bold pt-2 text-white">Players</h1>
        
        <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} hideEditIcon={true}/>
        
        {/* Move refresh button here and add margin-top */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {selectedGroup ? (
        <>
        {session && isGroupAdmin && (
          <><div className="mt-4 flex gap-6">
            
            </div><div className="mt-2">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  variant="default"
                  className="w-full md:w-auto"
                >
                  Show Pending Players
                </Button>
              </div></>
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
          />
        </>
      ) : (
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}