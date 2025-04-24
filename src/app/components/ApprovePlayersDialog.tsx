"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useGroup } from "../context/GroupContext";
import { usePlayerName } from "../hooks/usePlayerName";

interface Player {
  id: string; // players.id is a UUID
  name: string;
  status: string;
}

interface ApprovePlayersProps {
  onClose: () => void;
  onApprove: () => void;
  groupId: string | null;
  isGroupAdmin: boolean;
}

export default function ApprovePlayers({
  onClose,
  onApprove,
  groupId,
  isGroupAdmin,
}: ApprovePlayersProps) {
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);

  // ✅ UUID validation function
  const isValidUUID = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id);

  useEffect(() => {
    if (!groupId || !isValidUUID(groupId)) {
      console.warn("⚠️ Invalid group ID:", groupId);
      return;
    }

    fetchPendingPlayers();
  }, [groupId]);

  const fetchPendingPlayers = async () => {
    console.log("🔍 Fetching pending players for group ID:", groupId);

    const { data, error } = await supabase
      .from("group_memberships")
      .select(`
        player_id,
        status,
        players!inner (
          id,
          name,
          phone
        )
      `)
      .eq("status", "pending")
      .eq("group_id", groupId);

    if (error) {
      console.error("❌ Error fetching pending players:", error);
      return;
    }

    const pending = data?.map(row => {
      const player = Array.isArray(row.players) ? row.players[0] : row.players;
      return {
        id: player?.id || "unknown",
        name: player?.name || "Unnamed Player", // We'll get the name directly from the players table
        status: row.status,
      };
    }) || [];

    setPendingPlayers(pending);
  };

  const handleApprove = async (player: Player, groupId: string) => {
      const response = await fetch("/api/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, groupId}),
        
      });
      console.log("Approve Player Response:", response);
    if (!isGroupAdmin || !groupId || !isValidUUID(groupId)) return;

    setPendingPlayers((players) => players.filter((p) => p.id !== player.id));
    onApprove();
  };

const handleDecline = async (playerId: string, groupId: string) => {
  if (!isGroupAdmin || !isValidUUID(groupId)) return;

  const { error } = await supabase
    .from("group_memberships")
    .delete()
    .eq("player_id", playerId)
    .eq("group_id", groupId)
    .eq("status", "pending");

  if (error) {
    console.error("Error declining player:", error);
    return;
  }
  setPendingPlayers((prev) => prev.filter((p) => p.id !== playerId));
};


  return (
    <Dialog open={true} onOpenChange={() => onClose()} >
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>Pending Player Requests</DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          {pendingPlayers.length === 0 ? (
            <p className="text-muted-foreground text-center">No pending requests</p>
          ) : (
            pendingPlayers.map((player) => (
              <Card key={player.id} className="p-4 bg-secondary">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex-grow">{player.name}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(player, groupId)}
                      size="sm"
                      className="w-24 bg-green-600"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        if (!groupId) return;
                        handleDecline(player.id, groupId);
                      }}
                      size="sm"
                      className="w-24 bg-red-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}