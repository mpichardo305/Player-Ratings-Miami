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
    return <div className="text-white text-center py-8">Loading games...</div>;
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
      <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-80 z-50">
        <div className="bg-gray-800 p-6 rounded-md">
          <p className="text-white">Are you sure you want to delete this game?</p>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              onClick={onConfirm}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Yes
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper for formatting date & time
  const formatDateTime = (date: string, time: string) => {
    const formattedDate = formatDatePreserveDay(date);
    const formattedTime = formatTimeOnly(time);
    return `${formattedDate} at ${formattedTime}`;
  };

  const renderGameRow = (game: Game) => (
    <div key={game.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
      <div>
        <p className="font-semibold text-white">{formatDateTime(game.date, game.start_time)}</p>
        <p className="text-sm text-gray-300">Field: {game.field_name}</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => handleView(game.id)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded"
          aria-label="View game details"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        {activeTab === "past" && (
          <button
            onClick={() => handleRate(game.id)}
            className="text-yellow-500 hover:text-yellow-700 p-1 rounded"
            aria-label="Rate players"
          >
            <StarIcon className="h-5 w-5" />
          </button>
        )}
        {isAdmin && activeTab === "upcoming" && (
          <>
            <button
              onClick={() => handleEdit(game.id)}
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
              aria-label="Edit game"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(game.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded"
              aria-label="Delete game"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Conditionally render upcoming or past
  const currentList = activeTab === "upcoming" ? upcomingGames : previousGames;

  return (
    <div className="bg-gray-700 rounded-lg p-4 mt-4">
      <h2 className="text-2xl font-bold mb-4 text-white">Games</h2>

      {/* Tab buttons to switch between upcoming/past */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "upcoming" ? "bg-gray-900 text-white" : "bg-gray-600 text-gray-300"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "past" ? "bg-gray-900 text-white" : "bg-gray-600 text-gray-300"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
      </div>

      {/* List of games based on the active tab */}
      {currentList.length === 0 ? (
        <p className="text-gray-300">
          {activeTab === "upcoming" ? "No upcoming games." : "No past games."}
        </p>
      ) : (
        <div className="space-y-2">
          {currentList.map((game) => renderGameRow(game))}
        </div>
      )}

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}
    </div>
  );
}