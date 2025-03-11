"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/app/utils/dateUtils";
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from "@/app/hooks/useGroupAdmin";
import { useRouter } from "next/navigation";
import { PencilIcon, EyeIcon } from "@heroicons/react/24/outline";

type Game = {
  id: string;
  field_name: string;
  start_time: string;
  group_id: string;
};

export default function AllGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const session = useSession();
  
  // We'll use the first game's group_id for the admin check
  // This is a simplification - ideally you'd check admin status per game
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
                <th className="py-3 px-4 text-left">Start Time</th>
                <th className="py-3 px-4 text-center">View</th>
                {isAdmin && <th className="py-3 px-4 text-center">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4">{game.field_name}</td>
                  <td className="py-3 px-4">{formatDate(game.start_time)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
