import React, { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import PlayerItem from "./PlayerItem";

type Rating = {
  rating: number;
  player_id: number;
  user_id?: string;
};

type Player = {
  id: number;
  name: string;
  status: string;
  avg_rating: number;
  ratings: Rating[];
};

type ApprovedPlayersListProps = {
  sessionUserId: string; // or number if your sessionUserId is numeric
  groupId: string;
};

export default function ApprovedPlayersList({ sessionUserId, groupId }: ApprovedPlayersListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) Fetch players & ratings all at once
  const fetchPlayersAndRatings = async () => {
    if (!groupId) return;
    setLoading(true);

    // Fetch all memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from("group_memberships")
      .select(`
        players:players!inner (
          id,
          name,
          status
        )
      `)
      .eq("group_id", groupId);

    if (membershipsError || !memberships) {
      console.error("❌ Error fetching players:", membershipsError);
      setPlayers([]);
      setLoading(false);
      return;
    }

    // Extract & filter approved players
    const approvedPlayers: Player[] = memberships
      .flatMap((m) => m.players ?? [])
      .filter((pl) => pl.status === "approved")
      .map((pl) => ({
        ...pl,
        avg_rating: 0,
        ratings: [],
      }));

    if (approvedPlayers.length === 0) {
      setPlayers([]);
      setLoading(false);
      return;
    }

// 3) Fetch ratings for these players
const playerIds = approvedPlayers.map((p) => p.id);
const { data: ratingsData, error: ratingsError } = await supabase
  .from("ratings")
  .select("player_id, rating, user_id")
  .in("player_id", playerIds);

if (ratingsError) {
  console.error("❌ Error fetching ratings:", ratingsError);
  setPlayers(approvedPlayers);
  setLoading(false);
  return;
}

// 4) Merge ratings into players
const playersWithRatings = approvedPlayers.map((player) => {
  const playerRatings = ratingsData?.filter((r) => r.player_id === player.id) || [];
  const sum = playerRatings.reduce((acc, curr) => acc + curr.rating, 0);
  const avg = playerRatings.length > 0 ? Math.ceil(sum / playerRatings.length) : 0;

  return {
    ...player,
    ratings: playerRatings,
    avg_rating: avg,
  };
});

setPlayers(playersWithRatings);
setLoading(false);
};

useEffect(() => {
fetchPlayersAndRatings();

// Optional: poll every 10s
const interval = setInterval(fetchPlayersAndRatings, 10000);
return () => clearInterval(interval);
}, [groupId]);

// Function to upsert a rating
const handleRate = async (playerId: number, rating: number) => {
// Prevent rating yourself if needed
if (playerId === parseInt(sessionUserId)) {
  console.warn("🚫 You can't rate yourself!");
  return;
}

// Upsert with composite conflict (player_id, user_id)
const { error } = await supabase
  .from("ratings")
  .upsert(
    { player_id: playerId, user_id: sessionUserId, rating },
    { onConflict: "player_id,user_id" }
  );

if (error) {
  console.error("❌ Error upserting rating:", error);
} else {
  console.log("✅ Rating submitted successfully!");
  // Refresh data
  fetchPlayersAndRatings();
}
};

return (
<div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
  {!loading && players.length === 0 && (
    <p className="text-gray-400">No approved players found.</p>
  )}

  {players.map((player) => {
    const isSelf = player.id === parseInt(sessionUserId);

    return (
      <div key={player.id} className="player-item">
        {/* PlayerItem now handles the 5-star UI */}
        <PlayerItem player={player} onRate={handleRate} isSelf={isSelf}/>

        {isSelf && <p className="text-gray-400">🚫 You can not rate yourself!</p>}
      </div>
    );
  })}
</div>
);
}