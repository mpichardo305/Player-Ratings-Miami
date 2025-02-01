// /components/ApprovedPlayersList.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import PlayerItem from "./PlayerItem";

type Player = {
  id: number;
  name: string;
  avg_rating: number;
  ratings: { rating: number; player_id: number }[];
};

type ApprovedPlayersListProps = {
  sessionUserId: string;
  groupId: string;
};

export default function ApprovedPlayersList({ sessionUserId, groupId }: ApprovedPlayersListProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  const fetchPlayers = async () => {
    // Query approved players via group_memberships
    const { data: playersData, error: playersError } = await supabase
      .from("group_memberships")
      .select(`
        player:players (
          id,
          name
        )
      `)
      .eq("group_id", groupId)
      .eq("status", "approved");

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return;
    }

    const playersList =
      playersData?.map(p => {
        const player = Array.isArray(p.player) ? p.player[0] : p.player;
        return {
          id: player?.id as number,
          name: player?.name as string,
          ratings: [] as { rating: number; player_id: number }[],
          avg_rating: 0,
        };
      }) || [];

    const playerIds = playersList.map(p => p.id);

    const { data: ratingsData, error: ratingsError } = await supabase
      .from("ratings")
      .select("*")
      .in("player_id", playerIds);

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
      return;
    }

    const playersWithRatings = playersList.map(player => {
      const playerRatings = ratingsData?.filter(r => r.player_id === player.id) || [];
      const avg_rating = Math.ceil(
        playerRatings.reduce((acc: number, curr: { rating: number; player_id: number }) => acc + curr.rating, 0) /
        (playerRatings.length || 1)
      );
      return {
        ...player,
        ratings: playerRatings,
        avg_rating,
      };
    });
    
    setPlayers(playersWithRatings);
  };

  useEffect(() => {
    fetchPlayers();
  }, [groupId]);

  const handleRate = async (playerId: number, rating: number) => {
    // Prevent self-rating
    const { data: playerOwner } = await supabase
      .from("players")
      .select("player_id")
      .eq("player_id", playerId)
      .single();

    if (playerOwner?.player_id === sessionUserId) {
      console.error("You can't rate your own player!");
      return;
    }

    const { error } = await supabase
      .from("ratings")
      .upsert({ player_id: playerId, rating }, { onConflict: "player_id,player_id" });
    if (!error) {
      fetchPlayers();
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
      {players.map(player => (
        <PlayerItem key={player.id} player={player} onRate={handleRate} />
      ))}
    </div>
  );
}