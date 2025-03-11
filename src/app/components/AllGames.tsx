"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/app/utils/dateUtils";

type Game = {
  id: string;
  field_name: string;
  start_time: string;
};

export default function AllGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
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
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4">{game.field_name}</td>
                  <td className="py-3 px-4">{formatDate(game.start_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
