'use client';
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import UnratedPlayersList from '@/app/components/UnratedPlayersList';
import { supabase } from '@/app/utils/supabaseClient';
import { hasGameEnded } from '@/app/utils/gameUtils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreCheckModal } from '@/app/components/ScoreCheckModal';
import { useGroup } from '@/app/context/GroupContext';
import { useSession } from "@/app/hooks/useSession";
import { GameDetailsCard } from "@/app/components/GameDetailsCard";
import { saveAuthContext } from "@/app/utils/authUtils";
type Game = {
  id: string;
  date: string;
  start_time: string;
  field_name?: string;
};


export function RatePlayersClient({ game, gameId }: { game: Game | null, gameId: string }) {
  "use client";

  const [userId, setUserId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const { currentGroup, isCurrentGroupAdmin } = useGroup();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadSession() {
      const { data: { session: userSession } } = await supabase.auth.getSession();
      setIsSessionLoading(false); // Set loading to false after session is loaded
    }

    loadSession();
  }, []);

  useEffect(() => {
    if (!session && !isSessionLoading) {
      saveAuthContext(gameId);
      // Check if we're already on the login page
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [session, gameId, router, isSessionLoading, pathname]);

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
            .limit(1); // ADDED: Limit the result to 1 row

          if (playerError) {
            console.error('Error fetching player:', playerError);
            return;
          }

          if (playerData && playerData.length > 0) { // MODIFIED: Check if playerData is an array and has at least one element
            console.log('Found player ID:', playerData[0].id);
            setPlayerId(playerData[0].id);
          }
        }
      } catch (error) {
        console.error('Error in getUserAndPlayerId:', error);
      }
    };

    getUserAndPlayerId();
  }, []);

  // Check if game has ended
  useEffect(() => {
    if (game) {
      if (!hasGameEnded(game.date, game.start_time)) {
        setError('This game has not ended yet. You can only rate players after the game has finished.');
      }
      setLoading(false);
    }
  }, [game]);

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
        <Card className="bg-muted border-muted-foreground/50">
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
      {isCurrentGroupAdmin && (
        <ScoreCheckModal
          isOpen={isCurrentGroupAdmin}
          onClose={() => { }}
          onNo={handleNoScore}
          gameId={gameId} // Pass the current game ID
        />
      )}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rate Players</h1>
        <p className="text-muted-foreground">
          Rate the players who participated in this game
        </p>
      </div>

      {game && (
        <GameDetailsCard
          fieldName={game.field_name ?? ''}
          date={game.date.toString()}
          startTime={game.start_time}
          groupName={currentGroup?.name ?? ''}
        />
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
