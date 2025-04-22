"use client";

import React, { useEffect, useState } from "react";
import { formatTimeOnly, formatDatePreserveDay } from "@/app/utils/dateUtils";
import { useSession } from "@/app/hooks/useSession";
import { useGroup } from "../context/GroupContext"
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { get } from "lodash";
import { getUserPlayerId } from "../utils/playerDb";
import GroupSelector, { Group } from "./GroupSelector";

type Game = {
  id: string;
  field_name: string;
  date: string;
  start_time: string;
  group_id: string;
};

export default function AllGames() {
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("past");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const router = useRouter();
  const { currentGroup, isCurrentGroupAdmin } = useGroup();
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const groupId   = selectedGroup?.id   ?? currentGroup?.id;
  const groupName = selectedGroup?.name ?? currentGroup?.name;

  const handleGroupChange = (group: Group) => {
    console.log('Group changed:', group);
    setSelectedGroup(group);
    // Add any additional logic needed when group changes
  };
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const cached = localStorage.getItem('playerRatingsMembershipCache');
        if (!cached) {
          throw new Error('No player ID found');
        }
        
        const { userId } = JSON.parse(cached);
        // Wait for the playerId to resolve
        const playerId = await getUserPlayerId(userId);
        setCurrentPlayerId(playerId);
        
        if (!playerId) {
          throw new Error('Could not resolve player ID');
        }

        const url = `/api/get-games?playerId=${playerId}` +
                    (groupId ? `&groupId=${groupId}` : "");
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Failed to fetch games");
        }
        const data = await response.json();
        setUpcomingGames(data.upcomingGames || []);
        setPreviousGames(data.previousGames || []);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [selectedGroup]);

  useEffect(() => {
    console.log('Current group:', { id: groupId, name: groupName });
  }, [groupId, groupName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="text-sm ml-2">Loading games...</span>
        
      </div>
    )
  }
  
  const handleView = (gameId: string) => {
    setSelectedAction(`view-${gameId}`);
    router.push(`/game/${gameId}?mode=view`);
  };

  const handleEdit = (gameId: string) => {
    setSelectedAction(`edit-${gameId}`);
    router.push(`/game/${gameId}?mode=edit`);
  };

  const handleRate = (gameId: string) => {
    setSelectedAction(`rate-${gameId}`);
    router.push(`/rate-players/${gameId}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedAction(`delete-${id}`);
    setShowDeleteModal(id);
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteModal) return;
    try {
      const response = await fetch(`/api/games/${showDeleteModal}/delete`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete game");
      }
      setUpcomingGames(upcomingGames.filter((g) => g.id !== showDeleteModal));
      setPreviousGames(previousGames.filter((g) => g.id !== showDeleteModal));
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("Failed to delete game");
    } finally {
      setShowDeleteModal(null);
    }
  };

  function DeleteModal({
    onConfirm,
    onCancel,
  }: {
    onConfirm: () => void;
    onCancel: () => void;
  }) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this game?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={onConfirm}>
              Delete
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Helper for formatting date & time
  const formatDateTime = (date: string, time: string) => {
    const formattedDate = formatDatePreserveDay(date);
    const formattedTime = formatTimeOnly(time);
    return `${formattedDate} at ${formattedTime}`;
  };

  const renderGameRow = (game: Game) => (
    <Card key={game.id} className="mb-2.5 bg-secondary border-secondary">
      <CardContent className="flex items-center justify-between p-[1.05rem]">
        <div>
          <p className="font-semibold text-foreground text-[1.05rem]">{formatDateTime(game.date, game.start_time)}</p>
          <p className="text-[0.95rem] text-muted-foreground">Field: {game.field_name}</p>
        </div>
        <div className="flex space-x-1"> {/* Reduced from space-x-2.5 to space-x-1 */}
          <Button 
            variant={selectedAction === `view-${game.id}` ? "default" : "ghost"} 
            size="icon" 
            className={`h-11 w-11 ${selectedAction === `view-${game.id}` ? "bg-primary text-primary-foreground" : ""}`} 
            onClick={() => handleView(game.id)}
          >
            <EyeIcon className="h-5 w-5" />
          </Button>
          {activeTab === "past" && (
            <Button 
              variant={selectedAction === `rate-${game.id}` ? "default" : "ghost"} 
              size="icon" 
              className={`h-11 w-11 ${selectedAction === `rate-${game.id}` ? "bg-primary text-primary-foreground" : ""}`} 
              onClick={() => handleRate(game.id)}
            >
              <StarIcon className="h-5 w-5" />
            </Button>
          )}
          {isCurrentGroupAdmin && activeTab === "upcoming" && (
            <>
              <Button 
                variant={selectedAction === `edit-${game.id}` ? "default" : "ghost"} 
                size="icon" 
                className={`h-11 w-11 ${selectedAction === `edit-${game.id}` ? "bg-primary text-primary-foreground" : ""}`} 
                onClick={() => handleEdit(game.id)}
              >
                <PencilIcon className="h-5 w-5" />
              </Button>
              <Button
                variant={selectedAction === `delete-${game.id}` ? "default" : "ghost"}
                size="icon"
                className={`h-11 w-11 ${selectedAction === `delete-${game.id}` ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => handleDeleteClick(game.id)}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-card">
      <CardHeader>
       
        <CardTitle className="text-foreground text-3xl">
          Games
        </CardTitle>
        <CardTitle className="text-muted-foreground text-1xl">
          <GroupSelector 
            hideEditIcon 
            playerId={currentPlayerId}
            onGroupSelect={handleGroupChange}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="past" value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "past")}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary h-[3.15rem]">
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[1.05rem]"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[1.05rem]"
            >
              Past
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            {upcomingGames.length === 0 ? (
              <p className="text-muted-foreground">No upcoming games.</p>
            ) : (
              <div className="space-y-2">
                {upcomingGames.map((game) => renderGameRow(game))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="past">
            {previousGames.length === 0 ? (
              <p className="text-muted-foreground">No past games.</p>
            ) : (
              <div className="space-y-2">
                {previousGames.map((game) => renderGameRow(game))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showDeleteModal && (
          <DeleteModal
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteModal(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}