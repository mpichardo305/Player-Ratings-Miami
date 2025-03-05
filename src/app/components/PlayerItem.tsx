'use client';
import React, { useState, useEffect } from 'react';

type PlayerItemProps = {
  player: {
    id: number;
    name: string;
    avg_rating: number;
    ratings: Array<{ rating: number; user_id?: string }>;
    total_votes?: number; // Add this new field
  };
  onRate: (playerId: number, rating: number) => void;
  isSelf: boolean;
};

export default function PlayerItem({ player, onRate, isSelf }: PlayerItemProps) {
  const [userRating, setUserRating] = useState(0);
  
  // Calculate total votes from ratings array
  const totalVotes = player.ratings.length;

  // Update local state when a new rating is selected
  const handleRating = (star: number) => {
    setUserRating(star);
    onRate(player.id, star);
  };

  return (
    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-white">{player.name}</h3>
      <div className="flex space-x-1 mt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            disabled={isSelf}
            className={`text-2xl ${
              star <= (userRating || player.avg_rating) ? "text-yellow-400" : "text-gray-500"
            } hover:scale-110 transition-transform ${
              isSelf ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-gray-400">
        {/* {totalVotes} {totalVotes === 1 ? 'rating' : 'ratings'} */}
      </span>
    </div>
  );
}