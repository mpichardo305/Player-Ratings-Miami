'use client';

import { useEffect, useState } from 'react';
import { fetchGameRaters, GameRater } from '../utils/ratingDb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTimeRelative } from '../utils/dateUtils';

type RatersListProps = {
  gameId: string;
};

export default function RatersList({ gameId }: RatersListProps) {
  const [raters, setRaters] = useState<GameRater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRaters() {
      try {
        setLoading(true);
        const data = await fetchGameRaters(gameId);
        setRaters(data);
      } catch (err) {
        console.error('Failed to fetch raters:', err);
        setError('Failed to load raters');
      } finally {
        setLoading(false);
      }
    }

    loadRaters();
  }, [gameId]);

  if (loading) {
    return <div className="text-center p-4">Loading raters...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Players Who Submitted Ratings ({raters.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {raters.length === 0 ? (
            <p className="text-muted-foreground">No ratings submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {raters.map((rater) => (
                <Card key={rater.player_id} className="bg-secondary">
                  <CardContent className="p-3 flex justify-between items-center">
                    <span className="text-foreground">{rater.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTimeRelative(rater.submitted_at)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}