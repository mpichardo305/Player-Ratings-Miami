"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

    const fetchPendingPlayers = async () => {
      console.log("🔍 Fetching pending players for group ID:", groupId);
    
      const { data, error } = await supabase
        .from("group_memberships")
        .select(`
          player_id,
          status,
          players!inner(id, name, status)
        `) // ✅ Ensure 'players' is properly referenced
        .eq("status", "pending")
        .eq("group_id", groupId);
    
      if (error) {
        console.error("❌ Error fetching pending players:", error);
        return;
      }
    
      if (!data || data.length === 0) {
        console.warn("⚠️ No pending players found.");
        setPendingPlayers([]);
        return;
      }
    
      console.log("✅ Fetched pending players:", data);
    
      const pending = data.map(row => {
        const player = Array.isArray(row.players) ? row.players[0] : row.players; // ✅ Handle array case
        return {
          id: player?.id || "unknown",  // ✅ Prevents undefined errors
          name: player?.name || "Unnamed Player", // ✅ Fallback name
          status: row.status,
        };
      });
    
      setPendingPlayers(pending);
    };

    fetchPendingPlayers();
  }, [groupId]);

  const handleApprove = async (player: Player) => {
      const response = await fetch("/api/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, groupId: '299af152-1d95-4ca2-84ba-43328284c38e'}),
        
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
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Pending Player Requests
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <span className="sr-only"></span>
          </button>
        </DialogHeader>
        <div className="mt-6 w-full">
          {pendingPlayers.length === 0 ? (
            <p className="text-gray-400">No pending requests</p>
          ) : (
            pendingPlayers.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md mb-3"
              >
                <span className="text-white">{player.name}</span>
                <button
                  onClick={() => handleApprove(player)}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (!groupId) return;
                    handleDecline(player.id, groupId);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}