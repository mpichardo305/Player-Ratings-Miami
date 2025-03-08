'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import PlayerSelection from '@/app/components/PlayerSelection';
import GameOperationSuccess from '@/app/components/GameOperationSuccess';
import styles from '@/app/CreateGame.module.css';

// Updated interface to match database schema
interface Game {
  id: string;
  game_id: string;
  field_name: string; // Fixed field name
  date: Date;
  start_time: string;
  created_at: Date;
  updated_at: Date;
  group_id: string;
}

export default function ManagePlayers() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [readableId, setReadableId] = useState('');

  useEffect(() => {
    async function fetchGameDetails() {
      try {
        console.log('Fetching game with ID:', gameId);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (error) {
          console.error('Error fetching game:', error);
          setError('Failed to load game details');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Game not found');
          setLoading(false);
          return;
        }

        console.log('Raw game data:', data);
        
        // Convert date strings to Date objects
        setGame({
          ...data,
          date: new Date(data.date),
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        });
        
        // Store the readable ID
        setReadableId(data.game_id);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchGameDetails();
  }, [gameId]);

  const handleUpdateSuccess = (gameId: string, readableGameId: string) => {
    setShowSuccess(true);
    // If readableGameId is provided, use it; otherwise use the state one
    if (readableGameId) {
      setReadableId(readableGameId);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return <div className={styles.container}>Loading game details...</div>;
  }

  if (error || !game) {
    return <div className={styles.container}>
      <h2>Error</h2>
      <p>{error || 'Failed to load game'}</p>
      <button onClick={() => router.push('/')}>Return Home</button>
    </div>;
  }

  return (
    <div className={styles.container}>
      {showSuccess ? (
        <GameOperationSuccess 
          gameId={gameId}
          readableId={readableId}
          mode="update"
        />
      ) : (
        <PlayerSelection
          gameDetails={game!}
          onBack={handleBack}
          mode="update"
          gameId={gameId}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
