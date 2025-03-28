"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovedPlayersList from "@/app/components/ApprovedPlayersList";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { Button } from "@/components/ui/button";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', selectedGroup?.id ?? '');
  const [viewOnly, setViewOnly] = useState(false);

  if (!session?.user) {
    return <div>Loading session...</div>;
  }


  return (
    <div className="min-h-screen bg- p-4 relative">
      <h1 className="text-3xl font-bold mb-2 pt-2 text-white">Players</h1>
      
      <GroupSelector sessionUserId={session.user.id} onGroupSelect={setSelectedGroup} hideEditIcon={true}/>
      
      {selectedGroup ? (
        <>
        {session && isGroupAdmin && (
          <><div className="mt-4 flex gap-6">
              
            </div><div className="mt-4">
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
          <ApprovedPlayersList 
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