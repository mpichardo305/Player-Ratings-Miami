"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, EyeIcon } from "lucide-react";
import { fetchGamePlayers } from "@/app/utils/playerDb";
import { Label } from "@/components/ui/label";
import { useSession } from "../hooks/useSession";
import { useGroup } from "../context/GroupContext";
import { Group } from "./GroupSelector";

type Player = {
  id: string;
  name: string;
};

const MAX_PLAYERS = 6; // or whatever your maximum number is

interface AssignTeamsProps {
  gameId: string;
  mode?: boolean;
}

export default function AssignTeams({ gameId, mode = false }: AssignTeamsProps) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "away">("home");
  const [homePlayers, setHomePlayers] = useState<string[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<string[]>([]);
  const [isHomeComplete, setIsHomeComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { isCurrentGroupAdmin } = useGroup();
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // First fetch player details if not present
        if (players.length === 0) {
          const gamePlayers = await fetchGamePlayers(gameId);
          setPlayers(gamePlayers);
        }

        // Fetch team assignments
        const response = await fetch(`/api/games/${gameId}/assign-teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        
        const data = await response.json();
        console.log('Fetched team data:', data); // Debug log

        if (!data.players || !Array.isArray(data.players)) {
          console.error('Invalid data structure:', data);
          return;
        }

        const home: string[] = [];
        const away: string[] = [];
        
        data.players.forEach((player: { player_id: string; team: string }) => {
          if (player.team === 'A') home.push(player.player_id);
          if (player.team === 'B') away.push(player.player_id);
        });

        console.log('Home:', home); // Debug log
        console.log('Away:', away); // Debug log

        setHomePlayers(home);
        setAwayPlayers(away);
        
      } catch (error) {
        console.error("Error fetching team assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [gameId, players.length]);

  const handleTeamNext = () => {
    setIsHomeComplete(true);
    setActiveTab("away");
    // Automatically select remaining players for Away team
    const remainingPlayers = players
      .filter(player => !homePlayers.includes(player.id))
      .map(player => player.id);
    setAwayPlayers(remainingPlayers);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsHomeComplete(false);
    setActiveTab("home");
    setAwayPlayers([]);
  };

  const handleSubmit = async () => {
    try {
      // Transform the home and away arrays into the expected format
      const teamUpdates = [
        ...homePlayers.map(playerId => ({ playerId, team: 'A' })),
        ...awayPlayers.map(playerId => ({ playerId, team: 'B' }))
      ];

      const response = await fetch(`/api/games/${gameId}/assign-teams`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamUpdates)
      });

      if (!response.ok) {
        throw new Error("Failed to assign teams");
      }

      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error("Error assigning teams:", error);
    }
  };

  const handlePlayerSelection = (playerId: string, team: "home" | "away") => {
    if (team === "home") {
      setHomePlayers(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    } else {
      setAwayPlayers(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    }
  };

  const showAllPlayers = (team: "home" | "away") => {
    if (team === "home") {
      return !isHomeComplete || isEditing || activeTab === "home";
    }
    return activeTab === "away" && (isEditing || !isHomeComplete);
  };

  const handleViewMode = () => {
    setIsViewMode(true);
    setActiveTab("home");
  };

  const TeamListView = () => {
    if (homePlayers.length === 0 && awayPlayers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-lg text-muted-foreground">Teams have not been assigned</p>
          {mode && (
            <Button 
              className="mt-4"
              onClick={() => router.push(`/game/${gameId}?mode=view`)}
              variant="default"
            >
              View Game Details
            </Button>
          )}
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-lg text-muted-foreground">Teams have not been assigned</p>
          {mode && (
            <Button 
              className="mt-4"
              onClick={() => router.push(`/game/${gameId}?mode=view`)}
              variant="default"
            >
              View Game Details
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">Home Team</Label>
          <div className="mt-2 space-y-2">
            {players
              .filter(player => homePlayers.includes(player.id))
              .map(player => (
                <div key={player.id} className="py-2 px-4 bg-secondary rounded-md">
                  {player.name}
                </div>
              ))}
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold">Away Team</Label>
          <div className="mt-2 space-y-2">
            {players
              .filter(player => awayPlayers.includes(player.id))
              .map(player => (
                <div key={player.id} className="py-2 px-4 bg-secondary rounded-md">
                  {player.name}
                </div>
              ))}
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          {/* Only show Back and Submit when NOT in view mode */}
          {!mode && (
            <>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setIsViewMode(false)}
              >
                Back
              </Button>
              {isCurrentGroupAdmin && (
                <Button 
                  className="flex-1" 
                  onClick={handleSubmit}
                  disabled={homePlayers.length > MAX_PLAYERS || awayPlayers.length > MAX_PLAYERS}
                >
                  Submit
                </Button>
              )}
            </>
          )}
          
          {/* Show View Game Details button when in view mode */}
          {mode && (
            <Button 
              className="flex-1"
              onClick={() => router.push(`/game/${gameId}?mode=view`)}
              variant="default"
            >
              View Game Details
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (mode) {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading teams...</span>
        </div>
      );
    }

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">Team Assignments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TeamListView />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  function onBack() {
    router.push(`/game/${gameId}?mode=view`);
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
        <CardTitle className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl"> Assign Teams</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isViewMode ? (
          <TeamListView />
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "home" | "away")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="home"
                  disabled={false} // Remove the disabled condition entirely to always allow access
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Home Team
                </TabsTrigger>
                <TabsTrigger 
                  value="away"
                  disabled={!isHomeComplete}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Away Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="space-y-4">
                <div>
                  <Label className="text-lg">Select players (max {MAX_PLAYERS})</Label>
                  <p className={`mt-1 ${homePlayers.length > MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>
                    {homePlayers.length}/{MAX_PLAYERS} players selected
                  </p>
                </div>
                
                {/* Show selected Home players */}
                <div className="mb-6 space-y-2">
                  <Label className="text-sm text-muted-foreground">Home Players</Label>
                  {players
                    .filter(player => homePlayers.includes(player.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`home-${player.id}`}
                            checked={true}
                            onCheckedChange={() => handlePlayerSelection(player.id, "home")}
                            disabled={!isCurrentGroupAdmin || (isHomeComplete && !isEditing)}
                          />
                          <label htmlFor={`home-${player.id}`}>{player.name}</label>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Show available players */}
                {showAllPlayers("home") && (
                  <>
                    {players.filter(player => !homePlayers.includes(player.id) && !awayPlayers.includes(player.id)).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Available Players</Label>
                        {players
                          .filter(player => !homePlayers.includes(player.id) && !awayPlayers.includes(player.id))
                          .map(player => (
                            <div key={player.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`home-${player.id}`}
                                  checked={false}
                                  onCheckedChange={() => handlePlayerSelection(player.id, "home")}
                                  disabled={homePlayers.length >= MAX_PLAYERS}
                                />
                                <label htmlFor={`home-${player.id}`}>{player.name}</label>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {!isHomeComplete && isCurrentGroupAdmin && (  // Only show Next button to admins
                  <>
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleTeamNext}
                    disabled={homePlayers.length === 0 || homePlayers.length > MAX_PLAYERS}
                  >
                    Next
                  </Button>
                  <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={()=> onBack()}
                    className="min-w-[100px]"
                  >
                    Back
                  </Button>
            </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="away" className="space-y-4">
                <div>
                  <Label className="text-lg">Select players (max {MAX_PLAYERS})</Label>
                  <p className={`mt-1 ${awayPlayers.length > MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>
                    {awayPlayers.length}/{MAX_PLAYERS} players selected
                  </p>
                </div>
                
                {/* Show selected Away players */}
                <div className="mb-6 space-y-2">
                    <Label className="text-sm text-muted-foreground block text-right">Away Players</Label>
                  {players
                    .filter(player => awayPlayers.includes(player.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2 justify-end w-full">
                          <label htmlFor={`away-${player.id}`}>{player.name}</label>
                          <Checkbox
                            id={`away-${player.id}`}
                            checked={true}
                            onCheckedChange={() => handlePlayerSelection(player.id, "away")}
                            disabled={!isCurrentGroupAdmin || (!isEditing && isHomeComplete)}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Show available players */}
                {players.filter(player => !homePlayers.includes(player.id) && !awayPlayers.includes(player.id)).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Available Players</Label>
                    {players
                      .filter(player => !homePlayers.includes(player.id) && !awayPlayers.includes(player.id))
                      .map(player => (
                        <div key={player.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2 justify-end w-full">
                            <label htmlFor={`away-${player.id}`}>{player.name}</label>
                            <Checkbox
                              id={`away-${player.id}`}
                              checked={false}
                              onCheckedChange={() => handlePlayerSelection(player.id, "away")}
                              disabled={!isCurrentGroupAdmin || (!isEditing && isHomeComplete)}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {isHomeComplete && isCurrentGroupAdmin && (
              <div className="flex space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleViewMode}
                  variant="default"
                >
                  View Teams
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}