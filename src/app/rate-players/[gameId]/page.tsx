"use client";

import { RatePlayersClient } from "@/app/components/RatePlayersClient";
import { Loader2 } from "lucide-react";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Game = {
  id: string;
  date: string;
  start_time: string;
  field_name?: string;
};

function RatePlayersPage() {
  const params = useParams();
  const { gameId } = params;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGame() {
      try {
        const fetchedGame = await fetchGameDetails(gameId as string);
        setGame(fetchedGame);
      } catch (error) {
        console.error("Error fetching game details:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameId]);

  if (loading) {
    return  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading teams...</span>
  </div>;
  }

  if (!game) {
    return <div>Error: Could not load game details.</div>;
  }

  return (
    <RatePlayersClient game={game} gameId={gameId as string} />
  );
}

async function fetchGameDetails(gameId: string): Promise<Game | null> {
  try {
    const response = await fetch(`/api/games/${gameId}`); // Use relative URL
    if (!response.ok) {
      throw new Error('Failed to fetch game details');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game:', error);
    return null;
  }
}

export default RatePlayersPage;
