"use client";

import React from "react";
import { useEffect, useState } from "react";
import { formatDateOnly, formatTimeOnly, formatDatePreserveDay } from "@/app/utils/dateUtils";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { useRouter } from "next/navigation";
import { PencilIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/outline";

type Game = {
  id: string;
  field_name: string;
  date: string;
  start_time: string;
  group_id: string;
};

export default function AllGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const router = useRouter();
  const session = useSession();
  
  const firstGroupId = games.length > 0 ? games[0]?.group_id : null;
  const isAdmin = useGroupAdmin(session?.user?.id ?? '', firstGroupId);
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/get-games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);

  const handleView = (gameId: string) => {
    router.push(`/game/${gameId}?mode=view`);
  };

  const handleEdit = (gameId: string) => {
    router.push(`/game/${gameId}?mode=edit`);
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading games...</div>;
  }

  const handleDeleteClick = (id: string) => {
    setShowDeleteModal(id);
  };

  // Use the '/delete' endpoint and remove the duplicate function
  const handleConfirmDelete = async () => {
    if (!showDeleteModal) return;
    try {
      const response = await fetch(`/api/games/${showDeleteModal}/delete`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete game");
      }
      setGames(games.filter((game) => game.id !== showDeleteModal));
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
            <button onClick={onConfirm} className="px-3 py-1 bg-red-500 text-white rounded">
              Yes
            </button>
            <button onClick={onCancel} className="px-3 py-1 bg-gray-400 text-white rounded">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 mt-4">
      <h2 className="text-2xl font-bold mb-4 text-white">All Games</h2>
      
      {games.length === 0 ? (
        <p className="text-white">No games found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-900">
                <th className="py-3 px-4 text-left">Field Name</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Start Time</th>
                <th className="py-3 px-4 text-center">View</th>
                {isAdmin && <th className="py-3 px-4 text-center">Edit</th>}
                {isAdmin && <th className="py-3 px-4 text-center">Delete</th>}
              </tr>
            </thead>
            <tbody>
              {games.map((game) => {
                console.log(`Game ID: ${game.id}, Date: ${game.date}, Type: ${typeof game.date}`);
                return (
                  <tr key={game.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">{game.field_name}</td>
                    <td className="py-3 px-4">{formatDatePreserveDay(game.date)}</td>
                    <td className="py-3 px-4">{formatTimeOnly(game.start_time)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleView(game.id)}
                        className="text-blue-400 hover:text-blue-300"
                        aria-label="View game details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEdit(game.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                          aria-label="Edit game"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(game.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                          aria-label="Delete game"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
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
