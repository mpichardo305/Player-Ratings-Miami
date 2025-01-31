"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
// import AddPlayer from "./AddPlayer";
import Layout from "@/./app/layout";


type Player = {
  id: number;
  name: string;
  avg_rating: number;
  ratings: { rating: number; user_id: number }[];
};

export default function Players() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  // const [role, setRole] = useState<string>("user");

  // ✅ Prevent multiple API calls
  const hasFetchedSession = useRef(false);
  const hasFetchedRole = useRef(false);

  useEffect(() => {
    if (hasFetchedSession.current) return; // ✅ Prevent duplicate calls
    hasFetchedSession.current = true;

    const fetchSession = async () => {
      const { data: { session }, error  } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ Error fetching session:", error);
      } else {
        console.log("✅ Supabase Session User ID:", session?.user?.id);
        console.log("🔍 Supabase Session User Phone:", session?.user.phone);
      }
      setSession(session);
    };

    fetchSession();
  }, []);

  useEffect(() => {
    if (!session?.user || hasFetchedRole.current) return;
    hasFetchedRole.current = true;
  
    const fetchRole = async () => {
      // ✅ Force a fresh session to get the correct user ID
      await supabase.auth.refreshSession();
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("phone", `+${session.user.phone}`)
        .single(); 
      console.log("Supabase Response:", { profile, error }); // Debug full response
  
      if (error) {
        console.error("❌ Error fetching role:", error);
      } else {
        console.log("✅ Fetched Role:", profile?.role);
        // setRole(profile?.role || "user");
      }
    };
  
    fetchRole();
  }, [session]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!session?.user) return;

      const { data } = await supabase
        .from("players")
        .select(`
          id,
          name,
          ratings (rating, user_id)
        `)
        .neq("ratings.user_id", session?.user?.id);

      if (data) {
        const playersWithRatings = data.map(player => ({
          ...player,
          avg_rating: Math.ceil(
            player.ratings.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) /
              (player.ratings.length || 1)
          ),
        }));
        setPlayers(playersWithRatings);
      }
    };

    fetchPlayers();
  }, [session]);

  const handleRating = async (playerId: number, rating: number) => {
    if (!session?.user) return;

    const { data: playerOwner } = await supabase
      .from("players")
      .select("user_id")
      .eq("id", playerId)
      .single();

    if (playerOwner?.user_id === session.user.id) {
      console.error("You can't rate your own player!");
      return;
    }

    const { error } = await supabase
      .from("ratings")
      .upsert(
        {
          player_id: playerId,
          user_id: session.user.id,
          rating,
        },
        { onConflict: "user_id,player_id" }
      );

    if (!error) {
      // Refresh ratings
      const updatedPlayers = players.map(player => {
        if (player.id === playerId) {
          const newRatings = [...player.ratings];
          const userRatingIndex = newRatings.findIndex(r => r.user_id === Number(session.user.id));
          if (userRatingIndex > -1) {
            newRatings[userRatingIndex].rating = rating;
          } else {
            newRatings.push({ rating, user_id: Number(session.user.id) });
          }
          return {
            ...player,
            avg_rating: Math.ceil(newRatings.reduce((acc, curr) => acc + curr.rating, 0) / newRatings.length),
          };
        }
        return player;
      });
      setPlayers(updatedPlayers);
    }
  };

  return (
<Layout>
      <h1 className="text-3xl font-bold mb-2">Players</h1>
      <p className="text-lg text-gray-400">Rate players below:</p>

      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
        <h2 className="text-xl font-semibold mb-3">Player List</h2>

        <div className="space-y-4">
          {players.map(player => (
            <div key={player.id} className="flex flex-col items-center bg-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-white">{player.name}</h3>
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRating(player.id, star)}
                    className={`text-2xl ${
                      star <= player.avg_rating ? "text-yellow-400" : "text-gray-500"
                    } hover:scale-110 transition-transform`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">Average Rating: {player.avg_rating}</p>
            </div>
          ))}
        </div>
      </div>
       {/* ✅ New Add Player Button at Bottom */}
       <div className="flex justify-center mt-6">
        <button
          onClick={() =>  router.push("/add-player")}
          className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition"
        >
          ➕ Add Player
        </button>
      </div>
    </Layout>
  );
}