"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovedPlayersList from "@/app/components/ApprovedPlayersList";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";

export default function Players() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  // const [playerId, setPlayerId] = useState<string>();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!session?.user) {
    return <div>Loading session...</div>;
  }

  const handleLogout = async () => {
    router.push("/logout");
  };

  return (
    <div className="min-h-screen bg-gray-600 p-4 relative">
      {/* Hamburger Menu Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white p-2 rounded-lg hover:bg-gray-700"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-800 p-4 shadow-lg">
            <div className="mt-16 flex flex-col space-y-4">
              <button
                onClick={handleLogout}
                className="text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-left"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
          {selectedGroup && (
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
          <ApprovedPlayersList sessionUserId={session.user.id} groupId={selectedGroup.id} />
        </>
      ) : (
        <p className="text-white">No groups found.</p>
      )}
    </div>
  );
}