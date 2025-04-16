"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UnratedPlayersList from '@/app/components/UnratedPlayersList';
import SessionGuard from '@/app/components/SessionGuard';
import { supabase } from '@/app/utils/supabaseClient';
import { hasGameEnded } from '@/app/utils/gameUtils';
import { formatDatePreserveDay, formatTimeOnly } from "@/app/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCheckModal } from '@/app/components/ScoreCheckModal';
import { useGroupAdmin } from '@/app/hooks/useGroupAdmin';
import { useSession } from "@/app/hooks/useSession";

type Game = {
  id: string;
  date: string;
  start_time: string;
  field_name?: string;  // Changed from fieldName to field_name to match API response
};

function RatePlayersContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const [userId, setUserId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScoreCheck, setShowScoreCheck] = useState(false);
  const session = useSession();
  const [groupId, setGroupId] = useState<string>('');
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', groupId);

  // Add effect to show score check modal when admin is determined
  useEffect(() => {
    if (isGroupAdmin) {
      setShowScoreCheck(true);
    }
  }, [isGroupAdmin]);

  // Get the current user ID and corresponding player ID from Supabase
  useEffect(() => {
    const getUserAndPlayerId = async () => {
      try {
        // Get user ID
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setUserId(userData.user.id);
          
          // Get player ID for this user
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('id')
            .eq('user_id', userData.user.id)
            .single();

          if (playerError) {
            console.error('Error fetching player:', playerError);
            return;
          }

          if (playerData) {
            console.log('Found player ID:', playerData.id);
            setPlayerId(playerData.id);
          }
        }
      } catch (error) {
        console.error('Error in getUserAndPlayerId:', error);
      }
    };
      
    getUserAndPlayerId();
  }, []);

  // Fetch game data to verify it has ended
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        
        const data = await response.json();
        console.log('Game data from API:', data);
        
        // Set the game data from the API response
        setGame(data);
        setGroupId(data.group_id);
        
        // Check if game has ended
        if (!hasGameEnded(data.date, data.start_time)) {
          setError('This game has not ended yet. You can only rate players after the game has finished.');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  const handleNoScore = () => {
    router.push(`/game/${gameId}/score?mode=edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="text-sm ml-2">Loading ratings...</span>
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-destructive text-destructive-foreground">
          <CardContent className="pt-6">
            <p>{error}</p>
            <Button
              onClick={() => router.push(`/game/${gameId}`)}
              variant="ghost"
              className="border border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ScoreCheckModal 
        isOpen={showScoreCheck}
        onClose={() => setShowScoreCheck(false)}
        onNo={handleNoScore}
        gameId={gameId} // Pass the current game ID
      />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rate Players</h1>
        <p className="text-muted-foreground">
          Rate the players who participated in this game
        </p>
      </div>
      
      {game && (
        <Card>
          <CardHeader>
            <CardTitle>{game.field_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-medium">
                  {formatDatePreserveDay(game.date)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-sm font-medium">
                  {formatTimeOnly(game.start_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {userId && playerId && (
        <UnratedPlayersList 
          playerId={playerId}
          gameId={gameId}
        />
        )}
      
      <div className="flex justify-start">
        <Button
          onClick={() => router.push(`/game/${gameId}`)}
          variant="ghost"
          className="border border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground"
        >
          Back
        </Button>
      </div>
    </div>
  );
}

export default function RatePlayersPage() {
  return (
    <SessionGuard>
      <RatePlayersContent />
    </SessionGuard>
  );
}
