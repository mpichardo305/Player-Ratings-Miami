"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import GroupSelector, { Group } from "@/app/components/GroupSelector";
import ApprovePlayersDialog from "@/app/components/ApprovePlayersDialog";
import InviteDialog from "@/app/components/InviteDialog";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const session = useSession();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { isAdmin: isGroupAdmin, loading: isAdminLoading } = useGroupAdmin(
    session?.user?.id ?? '',
    selectedGroup?.id ?? ''
  );
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  if (!session?.user) {
    return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  }

  if (selectedGroup && isAdminLoading) {
    return <div className="flex justify-center items-center h-screen">Loading group admin status...</div>;
  }

  function handleCreateGame(id: string): void {
    router.push(`/create-game/groupId=${id}`);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">
          Dashboard
        </h1>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Group Name
            <span className="text-muted-foreground text-sm ml-2">
              {selectedGroup ? `(${selectedGroup.name})` : ''}
            </span>
          </CardTitle>
          
        </CardHeader>
        <CardContent>
          <GroupSelector 
            sessionUserId={session.user.id} 
            onGroupSelect={setSelectedGroup} 
          />
        </CardContent>
      </Card>

      {session && !isGroupAdmin && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              There is nothing to see here yet. Adding more controls soon.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedGroup && session && isGroupAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Button
            onClick={() => handleCreateGame(selectedGroup.id)}
            variant="default"
            size="lg"
            className="w-full"
          >
            Create Game
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Show Pending Players
          </Button>
        </div>
      )}

      {selectedGroup && isGroupAdmin && (
        <InviteDialog 
          groupId={selectedGroup.id} 
          onClose={() => setShowApproveDialog(false)}
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

      <Button
        onClick={() => router.push('/')}
        variant="ghost"
        className="mt-4 border border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground"
      >
        Back
      </Button>
    </div>
  );
}