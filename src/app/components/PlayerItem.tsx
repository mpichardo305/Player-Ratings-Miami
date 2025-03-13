'use client';
import React, { useState, useEffect } from 'react';

type Rating = {
  rating: number;
  user_id?: string;
};

type Player = {
  id: string;
  name: string;
  avg_rating: number;
  ratings: Rating[];
  total_votes?: number;
};

type PlayerItemProps = {
  player: Player;
  onRate: (playerId: string, rating: number) => void;
  isSelf?: boolean;
  pendingRating?: number;
};

export default function PlayerItem({
  player,
  onRate,
  isSelf = false,
  pendingRating,
}: PlayerItemProps) {
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    // If there's a pending rating, use that first, otherwise fall back to player's average rating.
    if (typeof pendingRating === 'number') {
      setUserRating(pendingRating);
    } else {
      setUserRating(player.avg_rating);
    }
  }, [pendingRating, player.avg_rating]);

  const handleRating = (newRating: number) => {
    setUserRating(newRating);
    onRate(player.id, newRating);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-white">{player.name}</h3>
        <div className="flex space-x-1 mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starIndex) => {
            // Determine if this star is empty, half, or full.
            let fillType: 'empty' | 'half' | 'full' = 'empty';

            if (userRating >= starIndex) {
              fillType = 'full';
            } else if (userRating >= starIndex - 0.5) {
              fillType = 'half';
            }

            return (
              <div key={starIndex} className="relative inline-block text-2xl">
                {/* Left half for half-star (e.g. 4.5) */}
                <button
                  type="button"
                  className="absolute left-0 top-0 w-1/2 h-full"
                  onClick={() => handleRating(starIndex - 0.5)}
                  disabled={isSelf}
                />
                {/* Right half for full-star (e.g. 5) */}
                <button
                  type="button"
                  className="absolute right-0 top-0 w-1/2 h-full"
                  onClick={() => handleRating(starIndex)}
                  disabled={isSelf}
                />
                {/* Gray star background */}
                <span className="text-gray-500 pointer-events-none">★</span>
                {/* Yellow star overlay (full or half) */}
                {fillType !== 'empty' && (
                  <span
                    className="text-yellow-400 pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: fillType === 'half' ? '50%' : '100%',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ★
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-gray-400">
          {userRating} {userRating === 1 ? 'star' : 'stars'}
        </span>
      </div>
    </div>
  );
}