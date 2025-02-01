"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";

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

  const handleApprove = async (playerId: string) => {
    if (!isGroupAdmin || !groupId || !isValidUUID(groupId)) return;

    const { error } = await supabase
      .from("group_memberships")
      .update({ status: "approved" })
      .eq("player_id", playerId)
      .eq("group_id", groupId)
      .eq("status", "pending");

    if (error) {
      console.error("Error approving player:", error);
      return;
    }
    setPendingPlayers((players) => players.filter((p) => p.id !== playerId));
    onApprove();
  };

  const handleDecline = async (playerId: string) => {
    if (!groupId || !isValidUUID(groupId)) return;

    const { error } = await supabase
      .from("group_memberships")
      .update({ status: "declined" })
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
    <div className="flex flex-col items-center bg-gray-900 min-h-screen p-6">
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
        <div className="relative bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg"
          >
            ❌
          </button>
          <h1 className="text-2xl font-bold text-white">Pending Player Requests</h1>
          <div className="mt-6 w-full max-w-md">
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
                    onClick={() => handleApprove(player.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecline(player.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}