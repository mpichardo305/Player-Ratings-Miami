"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { getUserPlayerId } from "../utils/playerDb";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [playerId, setPlayerId] = useState<string>(''); // Add this line

  const {
    isAdmin: isGroupAdmin,
    loading: isAdminLoading,
  } = useGroupAdmin(playerId, selectedGroup?.id ?? "");

  useEffect(() => {
    async function fetchPlayerId() {
      if (session?.user?.id) {
        const id = await getUserPlayerId(session.user.id);
        setPlayerId(id ?? "");
      }
    }
    fetchPlayerId();
  }, [session?.user?.id]);

  if (!session?.user) {
    return <div>Loading session...</div>;
  }

  if (!session?.user || (selectedGroup && isAdminLoading)) {
    return <div>Loading...</div>;
  }
  function handleCreateGame(id: string): void {
    router.push(`/create-game/groupId=${id}`);
  }
console.log(isGroupAdmin, "isGroupAdmin boolean");
  return (
    <div className="min-h-screen bg-gray-600 p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
       
      </div>
      
      <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} />
      
      {session && !isGroupAdmin && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-white">
          <p>There is nothing to see here yet. Adding more controls soon.</p>
        </div>
      )}
      
      {selectedGroup ? (
        isGroupAdmin ? (
          <>
            {session && isGroupAdmin && (
              <>
                <div className="mt-4 flex gap-6">
                  <button
                    onClick={() => handleCreateGame(selectedGroup.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Create Game
                  </button>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowApproveDialog(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Show Pending Players
                  </button>
                </div>
                <InviteDialog 
                  groupId={selectedGroup.id} 
                  onClose={() => setShowApproveDialog(false)}
                />
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
          </>
        ) : (
          <div></div>
        )
      ) : (
        <p className="text-white">No groups found.</p>
      )}

<button
        onClick={() => router.push('/')}
        className="back-button"
      >
        <span>Cancel</span>
      </button>
    </div>
  );
}