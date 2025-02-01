"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";

interface Player {
  id: number;
  name: string;
  status: string;
}
interface ApprovePlayersProps {
  onClose: () => void;
  onApprove: () => void;
  groupId: string | null;
  isGroupAdmin: boolean;
}

export default function ApprovePlayers({ onClose, onApprove, groupId, isGroupAdmin }: ApprovePlayersProps) {
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!groupId) return;

    const fetchPendingPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'pending')
        .eq('group_id', groupId);

      if (!error) {
        setPendingPlayers(data || []);
      }
    };

    fetchPendingPlayers();
  }, [groupId]);

  const handleApprove = async (playerId: number) => {
    if (!isGroupAdmin || !groupId) return;

    const { error } = await supabase
      .from('players')
      .update({ status: 'approved' })
      .eq('id', playerId)
      .eq('group_id', groupId);

    if (!error) {
      setPendingPlayers(players => players.filter(p => p.id !== playerId));
      onApprove();
    }
  };

  const handleDecline = async (playerId: number) => {
    await fetch("/api/approve-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    setPendingPlayers(pendingPlayers.filter(p => p.id !== playerId)); // Remove from UI
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
          pendingPlayers.map(player => (
            <div key={player.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md mb-3">
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