'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import toast from 'react-hot-toast';

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
  viewOnly?: boolean;
};

export default function PlayerItem({
  player,
  onRate,
  isSelf = false,
  pendingRating,
  viewOnly = false,
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
    if (viewOnly) {
      // Show a tooltip or message when users try to interact
      alert('Rating is disabled in view-only mode.');
      return;
    }
    setUserRating(newRating);
    onRate(player.id, newRating);
  };

  const handleRatingClick = (newRating: number) => {
    if (isSelf || viewOnly) {
      // Create a temporary toast/alert
      const alert = document.createElement('div');
      alert.className = 'fixed top-10 right-10 bg-amber-500 text-white p-4 rounded-lg shadow-lg z-50';
      
      // Prioritize the isSelf message over viewOnly
      alert.textContent = isSelf 
        ? '⚠️ You cannot rate yourself.'
        : '🔒 This is view only mode.';
      
      document.body.appendChild(alert);
      
      // Remove after 2 seconds
      setTimeout(() => {
        alert.remove();
      }, 2000);
      
      return;
    }
    
    // Normal rating handling
    onRate(player.id, newRating);
  };

  return (
    <Card className="bg-secondary border-secondary">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-foreground text-lg font-semibold">{player.name}</h3>
            <div className="flex space-x-1 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starIndex) => {
                let fillType: 'empty' | 'half' | 'full' = 'empty';

                if (userRating >= starIndex) {
                  fillType = 'full';
                } else if (userRating >= starIndex - 0.5) {
                  fillType = 'half';
                }

                return (
                  <div key={starIndex} className="relative inline-block text-2xl">
                    {/* Interactive buttons */}
                    <button
                      type="button"
                      className="absolute left-0 top-0 w-1/2 h-full"
                      onClick={() => handleRatingClick(starIndex - 0.5)}
                      disabled={isSelf || viewOnly}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 w-1/2 h-full"
                      onClick={() => handleRatingClick(starIndex)}
                      disabled={isSelf || viewOnly}
                    />
                    {/* Background star - changed from text-muted to text-muted-foreground */}
                    <span className="text-muted-foreground pointer-events-none">★</span>
                    {/* Primary color star overlay */}
                    {fillType !== 'empty' && (
                      <span
                        className="text-primary pointer-events-none absolute left-0 top-0 overflow-hidden whitespace-nowrap"
                        style={{
                          width: fillType === 'half' ? '50%' : '100%'
                        }}
                      >
                        ★
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-mutedForeground text-sm">
              {userRating} {userRating === 1 ? 'star' : 'stars'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}