import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { updateGamePlayers } from '../lib/updateGameService';
import { createGame, GameCreate } from '../lib/gameService';  
import { formatDatePreserveDay, formatTimeOnly } from '../utils/dateUtils';
import { Player, fetchGroupPlayers, fetchExistingPlayerIds } from '../utils/playerDb';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";
import { GameDetailsCard } from './GameDetailsCard';
import { useGroup } from '@/app/context/GroupContext';

interface PlayerSelectionProps {
  gameDetails: GameCreate;
  onBack: () => void;
  mode: 'create' | 'update';
  gameId?: string;
  onSuccess?: (gameId: string, readableId: string) => void;
}

const PlayerSelection = ({ gameDetails, onBack, mode = 'create', gameId = '', onSuccess }: PlayerSelectionProps) => {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentGroup } = useGroup();
  const MAX_PLAYERS = 12;

  // Generate Game ID
  interface GameIdPair {
    uuid: string;
    readableId: string;
  }

  function genGameId(): GameIdPair {
    const uuid = uuidv4();
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idLength = 4;
    let readableId = 'P-';
    
    for (let i = 0; i < idLength; i++) {
      readableId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return { uuid, readableId };
  }

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const approvedPlayers = await fetchGroupPlayers(currentGroup?.id ?? '');
      setPlayers(approvedPlayers);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPlayers = async () => {
    if (mode !== 'update' || !gameId) return;
    
    try {
      const existingPlayerIds = await fetchExistingPlayerIds(gameId);
      if (existingPlayerIds.length > 0) {
        setSelectedPlayers(new Set(existingPlayerIds));
      }
    } catch (error) {
      console.error('Error loading existing players:', error);
    }
  };

  useEffect(() => {
    fetchPlayers();
    if (mode === 'update' && gameId) {
      loadExistingPlayers();
    }
  }, [mode, gameId]);

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      // Only add new player if we haven't reached max
      if (newSelected.size < MAX_PLAYERS) {
        newSelected.add(playerId);
      } else {
        alert(`Maximum of ${MAX_PLAYERS} players allowed`);
        return;
      }
    }
    setSelectedPlayers(newSelected);
  };

  const handleSubmit = async () => {
    // Only proceed if we have a valid number of players
    try {
      setSubmitting(true);
      
      if (mode === 'create') {
        // Generate game IDs first
        const { uuid, readableId } = genGameId();
        
        // Update game details with the generated IDs
        const gameWithIds = {
          ...gameDetails,
          id: uuid,
          game_id: readableId
        };
        
        // Call the createGame API with the game details including IDs
        const gameCreationResponse = await createGame(gameWithIds);
        
        // Now update the game players with the same game UUID
        const updateResponse = await updateGamePlayers(uuid, { players: Array.from(selectedPlayers) });
        
        // Call success callback instead of alert
        if (onSuccess) {
          onSuccess(uuid, readableId);
        }
      } else if (mode === 'update' && gameId) {
        // Just update the players for existing game
        const updateResponse = await updateGamePlayers(gameId, { players: Array.from(selectedPlayers) });
        
        // Call success callback if provided
        if (onSuccess) {
          // We use gameId twice since we don't have readableId in update mode
          onSuccess(gameId, gameDetails.id || '');
        }
      }
      
    } catch (error) {
      console.error('Error managing game players:', error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Failed: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTeams = () => {
    router.push(`/game/${gameId}/teams`);
  };

  const isValidTeamSize = selectedPlayers.size <= MAX_PLAYERS;
  const buttonText = mode === 'create' ? 'Create Game' : 'Update Players';
  const submittingText = mode === 'create' ? 'Creating...' : 'Updating...';

  if (loading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2 pt-4"> {/* Reduced top and bottom padding */}
        <CardTitle className="text-foreground text-[1.3rem]">
          {mode === 'create' ? 'Game Details' : 'Update Game Players'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4"> {/* Reduced spacing between elements */}
        <div className="space-y-4">
          <GameDetailsCard
            fieldName={gameDetails.field_name}
            date={gameDetails.date.toString()}
            startTime={gameDetails.start_time}
            groupName={currentGroup?.name ?? ''}
          />
          <div className="text-foreground space-y-6">
            <div>
              <Label className="text-lg">Select players (max {MAX_PLAYERS})</Label>
              <p className={`mt-1 ${selectedPlayers.size > MAX_PLAYERS ? "text-destructive" : "text-mutedForeground"}`}>
                {selectedPlayers.size}/{MAX_PLAYERS} players selected
              </p>
            </div>

            {loading ? (
              <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">
              Loading players...
            </span></>
            ) : (
              <div className="space-y-6">
                {/* Selected Players Section */}
                <div className="mb-6">
                  <Label className="text-sm text-muted-foreground mb-2 block">Selected Players</Label>
                  <ScrollArea className="h-[200px] rounded-md border border-secondary p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {players
                        .filter(player => selectedPlayers.has(player.id))
                        .map(player => (
                          <div
                            key={player.id}
                            className="bg-secondary border-secondary rounded-lg p-2"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`selected-${player.id}`}
                                checked={true}
                                onCheckedChange={() => handlePlayerToggle(player.id)}
                                className="bg-secondary border-primary"
                              />
                              <Label
                                htmlFor={`selected-${player.id}`}
                                className="text-foreground cursor-pointer text-sm truncate"
                              >
                                {player.name}
                              </Label>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Available Players Section */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Available Players</Label>
                  <ScrollArea className="h-[300px] rounded-md border border-secondary p-4">
                    <div className="space-y-4">
                      {players
                        .filter(player => !selectedPlayers.has(player.id))
                        .map(player => (
                          <div
                            key={player.id}
                            className="bg-secondary border-secondary rounded-lg p-3 hover:bg-secondary/80 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={player.id}
                                checked={false}
                                onCheckedChange={() => handlePlayerToggle(player.id)}
                                disabled={selectedPlayers.size >= MAX_PLAYERS}
                                className="bg-secondary border-primary"
                              />
                              <Label
                                htmlFor={player.id}
                                className="text-foreground cursor-pointer"
                              >
                                {player.name}
                              </Label>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-4 pt-4">
            

            <div className="flex flex-col space-y-2">
              {selectedPlayers.size >= 2 && mode === 'update' && (
                <Button
                  variant="default"
                  onClick={handleAssignTeams}
                  className="w-full"
                >
                  Assign Teams
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={!isValidTeamSize || submitting}
                className="bg-primary text-primaryForeground w-full"
              >
                {submitting ? submittingText : buttonText}
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={submitting}
                className="min-w-[100px]"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerSelection;
