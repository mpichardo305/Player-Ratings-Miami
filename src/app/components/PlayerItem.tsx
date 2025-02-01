// PlayerItem.tsx
import React, { useState } from "react";

type Rating = {
  rating: number;
  player_id: number;
  user_id?: string;
};

type Player = {
  id: number;
  name: string;
  avg_rating: number;
  ratings: Rating[];
};

type PlayerItemProps = {
  player: Player;
  onRate: (playerId: number, ratingValue: number) => void;
  isSelf?: boolean;
};

export default function PlayerItem({ player, onRate, isSelf }: PlayerItemProps) {
  const [localRating, setLocalRating] = useState(player.avg_rating);

  const handleStarClick = (starNumber: number) => {
    if (isSelf) {
      console.warn("🚫 Can't rate yourself!");
      return;
    }
    setLocalRating(starNumber);
    onRate(player.id, starNumber);
  };

  return (
    <div className="bg-gray-800 rounded-md shadow-md p-6 mb-6 max-w-sm mx-auto text-white text-center">
      {/* Player Name */}
      <div className="text-xl font-bold mb-3">{player.name}</div>

      {/* Star row, centered horizontally */}
      <div className="flex items-center justify-center mb-3">
        {[1, 2, 3, 4, 5].map((star) => {
          // If star <= localRating => green, else gray
          const color = star <= localRating ? "text-green-400" : "text-gray-600";
          return (
            <span
              key={star}
              onClick={() => handleStarClick(star)}
              className={`${color} cursor-pointer text-2xl mx-1`}
            >
              ★
            </span>
          );
        })}
      </div>

      {/* Display DB average rating */}
      <p className="text-gray-400 text-sm">Average Rating: {player.avg_rating}</p>
    </div>
  );
}