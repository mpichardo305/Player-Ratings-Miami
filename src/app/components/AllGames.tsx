"use client";

import React from "react";
import { useEffect, useState } from "react";
import { formatDateOnly, formatTimeOnly, formatDatePreserveDay } from "@/app/utils/dateUtils";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { useRouter } from "next/navigation";
import { PencilIcon, EyeIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

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
  const [showPreviousGames, setShowPreviousGames] = useState(false);
  const router = useRouter();
  const session = useSession();
  
  // Use the first upcoming game's group_id or the first previous game's group_id if there are no upcoming games
  const firstGroupId = upcomingGames.length > 0 ? upcomingGames[0]?.group_id : 
                     (previousGames.length > 0 ? previousGames[0]?.group_id : null);
                     
  const isAdmin = useGroupAdmin(session?.user?.id ?? '', firstGroupId);
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/get-games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const data = await response.json();
        
        // Correctly set the separate game arrays
        setUpcomingGames(data.upcomingGames || []);
        setPreviousGames(data.previousGames || []);
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

  const handleConfirmDelete = async () => {
    if (!showDeleteModal) return;
    try {
      const response = await fetch(`/api/games/${showDeleteModal}/delete`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete game");
      }
      
      // Update both game lists after deletion
      setUpcomingGames(upcomingGames.filter((game) => game.id !== showDeleteModal));
      setPreviousGames(previousGames.filter((game) => game.id !== showDeleteModal));
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

  const togglePreviousGames = () => {
    setShowPreviousGames(!showPreviousGames);
  };

  const formatDateTime = (date: string, time: string) => {
    const formattedDate = formatDatePreserveDay(date);
    const formattedTime = formatTimeOnly(time);
    
    return `${formattedDate} at ${formattedTime}`;
  };

  const renderGameActions = (game: Game) => {
    return (
      <div className="flex justify-end space-x-2 mt-2">
        <button
          onClick={() => handleView(game.id)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded"
          aria-label="View game details"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        
        {isAdmin && (
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
    );
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 mt-4">
      <h2 className="text-2xl font-bold mb-4 text-white">All Games</h2>
      
      {upcomingGames.length === 0 && previousGames.length === 0 ? (
        <p className="text-white">No games found.</p>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Games Section */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-3 text-white">Upcoming Games</h3>
            {upcomingGames.length > 0 ? (
              <div className="space-y-2">
                {upcomingGames.map((game) => (
                  <div key={game.id} className="bg-gray-700 p-4 rounded-lg shadow">
                    <p className="font-medium text-white">{formatDateTime(game.date, game.start_time)}</p>
                    <p className="text-gray-300">Field: {game.field_name}</p>
                    {renderGameActions(game)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">No upcoming games scheduled.</p>
            )}
          </div>

          {/* Previous Games Section */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div 
              className="flex justify-between items-center cursor-pointer mb-3"
              onClick={togglePreviousGames}
            >
              <h3 className="text-xl font-bold text-white">Previous Games</h3>
              <button className="p-1 text-white">
                {showPreviousGames ? 
                  <ChevronUpIcon className="h-5 w-5" /> : 
                  <ChevronDownIcon className="h-5 w-5" />
                }
              </button>
            </div>
            
            {showPreviousGames && previousGames.length > 0 && (
              <div className="space-y-2">
                {previousGames.map((game) => (
                  <div key={game.id} className="bg-gray-700 p-4 rounded-lg shadow">
                    <p className="font-medium text-white">{formatDateTime(game.date, game.start_time)}</p>
                    <p className="text-gray-300">Field: {game.field_name}</p>
                    {renderGameActions(game)}
                  </div>
                ))}
              </div>
            )}
            
            {showPreviousGames && previousGames.length === 0 && (
              <p className="text-gray-300">No previous games found.</p>
            )}
          </div>
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
