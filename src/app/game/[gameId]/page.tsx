'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import styles from '@/app/CreateGame.module.css';
import { FaShareAlt } from 'react-icons/fa';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

// Updated interface to match the database schema
interface Game {
  id: string;
  game_id: string; // Human readable ID
  field_name: string; // Fixed field name property
  date: Date;
  start_time: string;
  created_at: Date;
  updated_at: Date;
  group_id: string;
}

type Player = {
  id: string;
  name: string;
  status: string;
};

export default function GameDetails() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  
  // Share functionality
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  function formatTimeTo12Hour(date: Date): string {
    return format(date, 'h:mm a'); // Outputs: "8:00 PM"
  }
  function formatDatetoUSA(date: Date): string {
    return format(parseISO(date.toString()), 'EEEE, MMMM do'); // Outputs: "Sunday, March 9th"
  }
  useEffect(() => {
    async function fetchGameDetails() {
      try {
        // Enable debugging to see the response
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

        // Log the raw data to see field names
        console.log('Raw game data:', data);

        // Convert date strings to Date objects
        setGame({
          ...data,
          date: formatDatetoUSA(data.date), // ✅ Now converts UTC → ET
          start_time: new Date(data.start_time),
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        });

        // After setting the game, fetch players
        fetchGamePlayers(data.id);
        // Fetch the group name if we have a group_id
        if (data.group_id) {
          await fetchGroupName(data.group_id);
        }
        
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    }

    const fetchGamePlayers = async (gameId: string) => {
      try {
        // First get player IDs from game_players
        const { data: playerRelations, error: relationsError } = await supabase
          .from('game_players')
          .select('player_id')
          .eq('game_id', gameId);
        
        if (relationsError || !playerRelations) {
          console.error('Error fetching player relations:', relationsError);
          setLoading(false);
          return;
        }
        
        if (playerRelations.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }
        
        // Get player details for each player ID
        const playerIds = playerRelations.map(relation => relation.player_id);
        
        const { data: playerDetails, error: playersError } = await supabase
          .from('players')
          .select('id, name, status')
          .in('id', playerIds);
          
        if (playersError) {
          console.error('Error fetching player details:', playersError);
          setPlayers([]);
        } else {
          setPlayers(playerDetails || []);
        }
      } catch (err) {
        console.error('Error in fetch players flow:', err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  const fetchGroupName = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();
        
      if (error) {
        console.error('Error fetching group name:', error);
        return;
      }
      
      if (data && data.name) {
        setGroupName(data.name);
      }
    } catch (err) {
      console.error('Error in fetchGroupName:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/game/${gameId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyConfirmation(true);
      setTimeout(() => setShowCopyConfirmation(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please try again.');
    }
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
// hardcoded the group name. Should later pull the group name from supabase based on the group_id
  return (
    <div className={styles.container}>
      <div className={styles.gameDetailsHeader}>
        <h2>Game Details</h2>
        
        <div className={styles.shareSection}>
          <button 
            onClick={handleShare} 
            className={styles.shareButton}
          >
            <FaShareAlt /> Share
          </button>
          {showCopyConfirmation && (
            <div className={styles.copyConfirmation}>
              Link copied!
            </div>
          )}
        </div>
      </div>
          
      <div className={styles.gameInfo}>
        <p><strong>Group:</strong> {groupName}</p>
        <p><strong>Field:</strong> {game.field_name}</p>
        <p><strong>Date:</strong> {String(game.date)}</p>
        <p><strong>Time:</strong> {formatTimeTo12Hour(new Date (game.start_time))}</p>
      </div>
      
      <div className={styles.playerList}>
        <h3>Players ({players.length})</h3>
        
        {players.length === 0 ? (
          <p>No players assigned to this game yet.</p>
        ) : (
          players.map(player => (
            <div key={player.id} className={styles.playerItem}>
              <span>{player.name}</span>
            </div>
          ))
        )}
      </div>
      
      <div className={styles.actionButtons}>
        <Link href="/" passHref>
          <button className={styles.secondaryButton}>
            Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
