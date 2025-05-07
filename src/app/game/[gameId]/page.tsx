"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";

import { useGroup } from "@/app/context/GroupContext";
import { hasGameEnded } from "@/app/utils/gameUtils";
import GameEditor from "@/app/components/GameEditor";

import { Player, fetchGamePlayers } from "@/app/utils/playerDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import RatersList from '@/app/components/RatersList';
import {checkTimeSinceGameStarted} from "@/app/utils/gameUtils";
import { GameDetailsCard } from '@/app/components/GameDetailsCard';

type Game = {
  id: string;
  date: string;
  field_name: string;
  start_time: string;
  group_id: string;
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view'; // Default to view mode
  
  const gameId = params.gameId as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [showRaters, setShowRaters] = useState(false);
  const [editingWindowClosed, setEditingWindowClosed] = useState(false);
  const [ratersLoading, setRatersLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentGroup, isCurrentGroupAdmin } = useGroup();
  
  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  // Fetch game players
  useEffect(() => {
    const loadGamePlayers = async () => {
      if (!gameId) return;
      
      setPlayersLoading(true);
      try {
        const gamePlayers = await fetchGamePlayers(gameId);
        setPlayers(gamePlayers);
      } catch (error) {
        console.error("Error loading game players:", error);
      } finally {
        setPlayersLoading(false);
      }
    };

    if (gameId) {
      loadGamePlayers();
    }
  }, [gameId]);

  // Track when admin check completes
  useEffect(() => {
    if (game?.group_id) {
      setAdminCheckComplete(true);
    }
  }, [game?.group_id]);

  // Redirect only after initial load and admin check are complete
  useEffect(() => {
    if (!initialLoad && adminCheckComplete && mode === 'edit' && !isCurrentGroupAdmin) {
      console.log("Redirecting to view mode - not an admin");
      router.push(`/game/${gameId}?mode=view`);
    }
  }, [initialLoad, adminCheckComplete, isCurrentGroupAdmin, mode, gameId, router]);

  // Check if game has ended whenever game data changes
  useEffect(() => {
    if (game?.date && game?.start_time) {
      setIsGameEnded(hasGameEnded(game.date, game.start_time));
    }
  }, [game]);

  useEffect(() => {
    const checkGameStatus = async () => {
      if (!gameId) return;
      
      try {
        const hoursSinceStart = await checkTimeSinceGameStarted(gameId);
        setGameFinished(hoursSinceStart > 1);
        setEditingWindowClosed(hoursSinceStart > 4)
      } catch (error) {
        console.error('Error checking game status:', error);
      }
    };

    checkGameStatus();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="text-sm ml-2">Loading game details...</span>
        
      </div>
    );
  }

  if (error && (mode !== 'edit' || !isCurrentGroupAdmin)) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-red-500 text-center p-8">{error}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-red-500 text-center p-8">Game not found</div>
      </div>
    );
  }

  // Prevent unauthorized edit access
  if (mode === 'edit' && !isCurrentGroupAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-red-500 text-center p-8">
          You do not have permission to edit this game.
        </div>
      </div>
    );
  }

  // View Mode
  if (mode === 'view') {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="bg-card">
          <CardHeader>
        <CardTitle className="text-foreground text-[1.3rem]">
          Game Details
        </CardTitle>
          </CardHeader>
          <CardContent>
        <div className="space-y-6">
          {/* Game Info */}
          <GameDetailsCard
            fieldName={game.field_name}
            date={game.date}
            startTime={game.start_time}
            groupName={currentGroup?.name} 
          />

          {/* Player Roster */}
          <Card className="bg-tertiary">
            <CardHeader>
          <CardTitle className="text-lg text-foreground">Roster</CardTitle>
            </CardHeader>
            <CardContent>
          {playersLoading ? (
            <p className="text-foreground">Loading players...</p>
          ) : players.length === 0 ? (
            <p className="text-muted-foreground">No players assigned to this game.</p>
          ) : (
            <ScrollArea className="h-[40vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {players.map((player) => (
              <Card key={player.id} className="bg-secondary">
                <CardContent className="p-3">
              <p className="text-foreground">{player.name}</p>
                </CardContent>
              </Card>
            ))}
              </div>
            </ScrollArea>
          )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {isGameEnded && isCurrentGroupAdmin && (
          <Button 
            className="bg-green-500 text-white hover:bg-green-600"
            onClick={() => router.push(`/game/${gameId}/score?mode=edit`)}
          >
            Submit Score
          </Button>
            )}
            {isGameEnded && !isCurrentGroupAdmin && (
          <Button 
            className="bg-green-500 text-white hover:bg-green-600"
            onClick={() => router.push(`/rate-players/${gameId}`)}
          >
            Rate Players
          </Button>
            )}
            {isCurrentGroupAdmin && (
          <>
            <Button
              variant="secondary"
              onClick={() => router.push(`/game/${gameId}?mode=edit`)}
              // disabled={editingWindowClosed}
            >
              Edit Game Details
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/manage-players/${gameId}`)}
              // disabled={editingWindowClosed}
            >
              Manage Players
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowRaters(true)}
            >
              See Who Rated
            </Button>
          </>
            )}
          </div>
        </div>
          </CardContent>
        </Card>
        <Button
        onClick={() => router.push('/')}
        variant="ghost"
        className="border border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground"
      >
        Back
      </Button>
      {showRaters && isCurrentGroupAdmin && gameFinished && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-card rounded-lg">
        <div className="flex justify-end gap-2 absolute right-2 top-2">
          <Button
            variant="ghost"
            onClick={() => {
              setIsRefreshing(true);
              setShowRaters(false);
              // Add a small delay before showing the modal again
              setTimeout(() => {
                setShowRaters(true);
                setIsRefreshing(false);
              }, 100);
            }}
            disabled={isRefreshing}
            title="Refresh"
          >
            ↻
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowRaters(false)}
          >
            ✕
          </Button>
        </div>
        <div className="p-6 mt-8">
          <RatersList gameId={gameId} key={Date.now()} />
        </div>
          </div>
        </div>
      )}
      </div>
    );
  }
  
  // Edit Mode - Use the unified GameEditor component
  return (
      <GameEditor mode="edit" gameId={gameId} />
  );
}
