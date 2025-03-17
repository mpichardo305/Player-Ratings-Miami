"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', selectedGroup?.id ?? null);

  if (!session?.user) {
    return <div>Loading session...</div>;
  }

  function handleCreateGame(id: string): void {
    router.push(`/create-game/groupId=${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-600 p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center"
        >
          <span>Back</span>
        </button>
      </div>
      
      <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} />
      
      {session && !isGroupAdmin && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-white">
          <p>Ability to create a new game coming soon!</p>
        </div>
      )}
      
      {selectedGroup ? (
        <>
        {session && isGroupAdmin && (
          <><div className="mt-4 flex gap-6">
              <button
                onClick={() => handleCreateGame(selectedGroup.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Create Game
              </button>
              
            </div><div className="mt-4">
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Show Pending Players
                </button>
              </div></>
        )}
          {selectedGroup && isGroupAdmin && (
            <InviteDialog groupId={selectedGroup.id} onClose={() => setShowApproveDialog(false)}
            />
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
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}