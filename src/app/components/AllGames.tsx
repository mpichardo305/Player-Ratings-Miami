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
import { supabase } from "../utils/supabaseClient";
import { Session } from "@supabase/auth-helpers-nextjs";

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
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(
    () => currentGroup?.playerId || null
  );  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const groupId   = selectedGroup?.id   ?? currentGroup?.id;
  const groupName = selectedGroup?.name ?? currentGroup?.name;
    const [session, setSession] = useState<Session | null>(null)
    const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    async function initializeComponent() {
      try {
        const { data: { session: userSession } } = await supabase.auth.getSession()
        setSession(userSession)
        console.log('Session initialized:', userSession?.user?.id)

        // Try to get player ID from different sources
        let resolvedPlayerId = null;

        // First try from group context
        if (currentGroup?.playerId) {
          console.log('Found player ID in group context:', currentGroup.playerId);
          resolvedPlayerId = currentGroup.playerId;
        }

        // Then try from cache if we don't have it yet
        if (!resolvedPlayerId && userSession?.user?.id) {
          const cached = localStorage.getItem(`membership_${userSession.user.id}`);
          console.log('Checking cache for player ID:', cached);
          
          if (cached) {
            const parsedCache = JSON.parse(cached);
            if (parsedCache.playerId) {
              console.log('Found player ID in cache:', parsedCache.playerId);
              resolvedPlayerId = parsedCache.playerId;
            }
          }
        }

        // Set the player ID if we found it from any source
        if (resolvedPlayerId) {
          setCurrentPlayerId(resolvedPlayerId);
        } else {
          console.log('No player ID found in any source');
        }
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }
    
    initializeComponent()
  }, []) // Remove supabase.auth dependency
  const handleGroupChange = (group: Group) => {
    console.log('Group change triggered:', {
      previous: selectedGroup,
      new: group,
      currentGroup
    });
    
    if (group?.id) {
      setSelectedGroup(group);
      // Optionally cache the selection
      if (session?.user?.id) {
        const cached = localStorage.getItem(`membership_${session.user.id}`);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          localStorage.setItem(`membership_${session.user.id}`, JSON.stringify({
            ...parsedCache,
            lastSelectedGroup: group
          }));
        }
      }
    }
  };
  useEffect(() => {
    const fetchGames = async () => {
      try {
        if (!session?.user?.id || !isInitialized) {
          console.log('Waiting for initialization...', {
            hasSession: !!session?.user?.id,
            isInitialized
          });
          return;
        }

        console.log('Fetching games with state:', {
          currentGroup,
          selectedGroup,
          groupId,
          groupName,
          currentPlayerId
        });

        // Add the actual API call
        if (!currentPlayerId) {
          console.error('No player ID available');
          return;
        }

        const url = `/api/get-games?playerId=${currentPlayerId}` +
                    (groupId ? `&groupId=${groupId}` : "");
        console.log('Fetching games from:', url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Games data received:', data);

        setUpcomingGames(data.upcomingGames || []);
        setPreviousGames(data.previousGames || []);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching games:", error);
        setLoading(false);
      }
    };

    fetchGames();
  }, [
    session,
    selectedGroup,
    isInitialized,
    currentGroup,
    currentPlayerId,
    groupId
  ]); // Make sure all these dependencies are included

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