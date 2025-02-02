'use client';
import React from 'react';

type PlayerItemProps = {
  player: {
    id: number;
    name: string;
    avg_rating: number;
    ratings: Array<{ rating: number; user_id?: string }>;
  };
  onRate: (playerId: number, rating: number) => void;
  isSelf: boolean;
};

export default function PlayerItem({ player, onRate, isSelf }: PlayerItemProps) {
  return (
    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-white">{player.name}</h3>
    <div className="flex space-x-1 mt-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onRate(player.id, star)}
          className={`text-2xl ${star <= player.avg_rating ? "text-yellow-400" : "text-gray-500"} hover:scale-110 transition-transform`}
        >
          ★
        </button>
      ))}
    </div>
          <span className="text-gray-400">
            ({player.avg_rating || 0})
          </span>
        </div>
  );
}