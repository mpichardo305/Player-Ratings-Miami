"use client";

import React, { useEffect, useState } from "react";
import { formatTimeOnly, formatDatePreserveDay } from "@/app/utils/dateUtils";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
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
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  const router = useRouter();
  const session = useSession();
  const firstGroupId =
    upcomingGames[0]?.group_id || previousGames[0]?.group_id;
  const { isAdmin, loading: isAdminLoading } = useGroupAdmin(session?.user?.id ?? "", firstGroupId ?? "");
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/get-games");
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
  }, []);

  if (loading || isAdminLoading) {
    return <div className="text-foreground text-center py-8">Loading games...</div>;
  }
  
  const handleView = (gameId: string) => {
    router.push(`/game/${gameId}?mode=view`);
  };

  const handleEdit = (gameId: string) => {
    router.push(`/game/${gameId}?mode=edit`);
  };

  const handleRate = (gameId: string) => {
    router.push(`/rate-players/${gameId}`);
  };

  const handleDeleteClick = (id: string) => {
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
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleView(game.id)}>
            <EyeIcon className="h-5 w-5" />
          </Button>
          {activeTab === "past" && (
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleRate(game.id)}>
              <StarIcon className="h-5 w-5" />
            </Button>
          )}
          {isAdmin && activeTab === "upcoming" && (
            <>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleEdit(game.id)}>
                <PencilIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
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

  // Conditionally render upcoming or past
  const currentList = activeTab === "upcoming" ? upcomingGames : previousGames;

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground text-[1.3rem]">Games</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "past")}>
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