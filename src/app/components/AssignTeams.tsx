"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, EyeIcon } from "lucide-react";
import { fetchGamePlayers } from "@/app/utils/playerDb";
import { Label } from "@/components/ui/label";

type Player = {
  id: string;
  name: string;
};

const MAX_PLAYERS = 6; // or whatever your maximum number is

export default function AssignTeams({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<"teamA" | "teamB">("teamA");
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);
  const [isTeamAComplete, setIsTeamAComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const gamePlayers = await fetchGamePlayers(gameId);
        setPlayers(gamePlayers);
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [gameId]);

  const handleTeamNext = () => {
    setIsTeamAComplete(true);
    setActiveTab("teamB");
    // Automatically select remaining players for Team B
    const remainingPlayers = players
      .filter(player => !teamAPlayers.includes(player.id))
      .map(player => player.id);
    setTeamBPlayers(remainingPlayers);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsTeamAComplete(false);
    setActiveTab("teamA");
    setTeamBPlayers([]);
  };

  const handleSubmit = async () => {
    try {
      // Transform the teamA and teamB arrays into the expected format
      const teamUpdates = [
        ...teamAPlayers.map(playerId => ({ playerId, team: 'A' })),
        ...teamBPlayers.map(playerId => ({ playerId, team: 'B' }))
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

  const handlePlayerSelection = (playerId: string, team: "teamA" | "teamB") => {
    if (team === "teamA") {
      setTeamAPlayers(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    } else {
      setTeamBPlayers(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    }
  };

  const showAllPlayers = (team: "teamA" | "teamB") => {
    if (team === "teamA") {
      return !isTeamAComplete || isEditing || activeTab === "teamA";
    }
    return activeTab === "teamB" && (isEditing || !isTeamAComplete);
  };

  const handleViewMode = () => {
    setIsViewMode(true);
    setActiveTab("teamA");
  };

  const TeamListView = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold">Team A</Label>
        <div className="mt-2 space-y-2">
          {players
            .filter(player => teamAPlayers.includes(player.id))
            .map(player => (
              <div key={player.id} className="py-2 px-4 bg-secondary rounded-md">
                {player.name}
              </div>
            ))}
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold">Team B</Label>
        <div className="mt-2 space-y-2">
          {players
            .filter(player => teamBPlayers.includes(player.id))
            .map(player => (
              <div key={player.id} className="py-2 px-4 bg-secondary rounded-md">
                {player.name}
              </div>
            ))}
        </div>
      </div>

      <div className="flex space-x-4 mt-6">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={() => setIsViewMode(false)}
        >
          Back
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleSubmit}
          disabled={teamAPlayers.length > MAX_PLAYERS || teamBPlayers.length > MAX_PLAYERS}
        >
          Submit
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Assign Teams</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isViewMode ? (
          <TeamListView />
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "teamA" | "teamB")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="teamA"
                  disabled={false} // Remove the disabled condition entirely to always allow access
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Team A
                </TabsTrigger>
                <TabsTrigger 
                  value="teamB"
                  disabled={!isTeamAComplete}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Team B
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teamA" className="space-y-4">
                <div>
                  <Label className="text-lg">Select players (max {MAX_PLAYERS})</Label>
                  <p className={`mt-1 ${teamAPlayers.length > MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>
                    {teamAPlayers.length}/{MAX_PLAYERS} players selected
                  </p>
                </div>
                
                {/* Show selected Team A players */}
                <div className="mb-6 space-y-2">
                  <Label className="text-sm text-muted-foreground">Team A Players</Label>
                  {players
                    .filter(player => teamAPlayers.includes(player.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`teamA-${player.id}`}
                            checked={true}
                            onCheckedChange={() => handlePlayerSelection(player.id, "teamA")}
                            disabled={isTeamAComplete && !isEditing}
                          />
                          <label htmlFor={`teamA-${player.id}`}>{player.name}</label>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Show available players */}
                {showAllPlayers("teamA") && (
                  <>
                    {players.filter(player => !teamAPlayers.includes(player.id) && !teamBPlayers.includes(player.id)).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Available Players</Label>
                        {players
                          .filter(player => !teamAPlayers.includes(player.id) && !teamBPlayers.includes(player.id))
                          .map(player => (
                            <div key={player.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`teamA-${player.id}`}
                                  checked={false}
                                  onCheckedChange={() => handlePlayerSelection(player.id, "teamA")}
                                  disabled={teamAPlayers.length >= MAX_PLAYERS}
                                />
                                <label htmlFor={`teamA-${player.id}`}>{player.name}</label>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {!isTeamAComplete && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleTeamNext}
                    disabled={teamAPlayers.length === 0 || teamAPlayers.length > MAX_PLAYERS}
                  >
                    Next
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="teamB" className="space-y-4">
                <div>
                  <Label className="text-lg">Select players (max {MAX_PLAYERS})</Label>
                  <p className={`mt-1 ${teamBPlayers.length > MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>
                    {teamBPlayers.length}/{MAX_PLAYERS} players selected
                  </p>
                </div>
                
                {/* Show selected Team B players */}
                <div className="mb-6 space-y-2">
                    <Label className="text-sm text-muted-foreground block text-right">Team B Players</Label>
                  {players
                    .filter(player => teamBPlayers.includes(player.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2 justify-end w-full">
                          <label htmlFor={`teamB-${player.id}`}>{player.name}</label>
                          <Checkbox
                            id={`teamB-${player.id}`}
                            checked={true}
                            onCheckedChange={() => handlePlayerSelection(player.id, "teamB")}
                            disabled={!isEditing && isTeamAComplete}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Show available players */}
                {players.filter(player => !teamAPlayers.includes(player.id) && !teamBPlayers.includes(player.id)).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Available Players</Label>
                    {players
                      .filter(player => !teamAPlayers.includes(player.id) && !teamBPlayers.includes(player.id))
                      .map(player => (
                        <div key={player.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2 justify-end w-full">
                            <label htmlFor={`teamB-${player.id}`}>{player.name}</label>
                            <Checkbox
                              id={`teamB-${player.id}`}
                              checked={false}
                              onCheckedChange={() => handlePlayerSelection(player.id, "teamB")}
                              disabled={!isEditing && isTeamAComplete}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {isTeamAComplete && (
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