// /pages/players.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovedPlayersList from "@/app/components/ApprovedPlayersList";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  if (!session?.user) {
    return <div>Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-600 p-4">
      <h1 className="text-3xl font-bold mb-2 text-white">Players</h1>
      
      <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} />
      
      {selectedGroup ? (
        <>
          {session && (
            <button
              onClick={() => setShowApproveDialog(true)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Show Pending Players
            </button>
          )}
          
          {showApproveDialog && selectedGroup && (
            <ApprovePlayersDialog 
              onClose={() => setShowApproveDialog(false)} 
              onApprove={() => {}}  // Hook up to refresh logic if needed
              groupId={selectedGroup.id}
              isGroupAdmin={true} // Pass the admin status from GroupSelector if needed
            />
          )}
          
          <ApprovedPlayersList sessionUserId={session.user.id} groupId={selectedGroup.id} />
        </>
      ) : (
        <p className="text-white">No groups found.</p>
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={() => router.push("/add-player")}
          className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition"
        >
          ➕ Add Player
        </button>
      </div>
    </div>
  );
}