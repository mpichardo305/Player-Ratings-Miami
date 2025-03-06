import { useState, useEffect, useRef } from 'react';
import styles from '../CreateGame.module.css';
import { supabase } from "@/app/utils/supabaseClient";
import { createGame, GameCreate } from '../../app/api/create-game/route';
import { v4 as uuidv4 } from 'uuid';
import { create, update } from 'lodash';
import { updateGamePlayers } from '../api/update-game-players/route';

type Player = {
  id: string;      
  name: string;
  status: string;
};

interface PlayerSelectionProps {
  gameDetails: GameCreate;
  onBack: () => void;
}

const PlayerSelection = ({ gameDetails, onBack }: PlayerSelectionProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'
  const MAX_PLAYERS = 12;

  // Generate Game ID
interface GameIdPair {
  uuid: string;
  readableId: string;
}

function genGameId(): GameIdPair {
  const uuid = uuidv4();
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLength = 4;
  let readableId = 'P-';
  
  for (let i = 0; i < idLength; i++) {
    readableId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return { uuid, readableId };
}
  const fetchPlayers = async () => {
    setLoading(true);

    try {
      // Fetch all memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_memberships")
        .select(`
          status,
          players:players!inner (
            id,
            name,
            status
          )
        `)
        .eq("group_id", GROUP_ID);

      if (membershipsError || !memberships) {
        console.error("❌ Error fetching players:", membershipsError);
        setPlayers([]);
        return;
      }

      const approvedPlayers: Player[] = memberships
      .filter((m) => m.status === "approved")  
      .flatMap((m) => m.players ?? [])
      .map((pl) => ({
        ...pl,
      }));

      if (approvedPlayers.length === 0) {
        setPlayers([]);
        return;
      }      
      setPlayers(approvedPlayers);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();    
  }, []);

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      // Only add new player if we haven't reached max
      if (newSelected.size < MAX_PLAYERS) {
        newSelected.add(playerId);
      } else {
        alert(`Maximum of ${MAX_PLAYERS} players allowed`);
        return;
      }
    }
    setSelectedPlayers(newSelected);
    
    // Update players when selection changes
    setPlayers(prevPlayers => prevPlayers.map(player => ({
      ...player,
      selected: newSelected.has(player.id)
    })));
  };

  const handleSubmit = async () => {
    // Only proceed if we have a valid number of players
    // if (selectedPlayers.size > MAX_PLAYERS) {
    //   alert(`Please select a maximum of ${MAX_PLAYERS} players.`);
    //   return;
    // }
    
    try {
      setSubmitting(true);
      console.log('Starting game creation process...');
      
      // Generate game IDs first
      const { uuid, readableId } = genGameId();
      console.log('Generated IDs:', { uuid, readableId });
      
      // Update game details with the generated IDs
      const gameWithIds = {
        ...gameDetails,
        id: uuid,
        game_id: readableId
      };
      console.log('Game details before API call:', gameWithIds);
      
      // Call the createGame API with the game details including IDs
      console.log('Calling createGame API...');
      const createdGame = await createGame(gameWithIds);
      console.log('Game created response:', createdGame);
      
      // Now update the game players with the same game UUID
      console.log('Updating game players with IDs:', Array.from(selectedPlayers));
      const updateResponse = await updateGamePlayers(uuid, { players: Array.from(selectedPlayers) });
      console.log('Update players response:', updateResponse);
      
      console.log('Game created successfully:', createdGame);
      console.log('Selected players:', Array.from(selectedPlayers));
      
      alert('Game created successfully!');
      
    } catch (error) {
      console.error('Error creating game:', error);
      let errorDetails;
      if (error instanceof Error) {
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        errorDetails = error;
      }
      console.error('Error details:', errorDetails);
      alert(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValidTeamSize = selectedPlayers.size <= MAX_PLAYERS;

  return (
    <div className={styles.playerSelection}>
      <h2>Game Details</h2>
      <div className={styles.gameInfo}>
        <p>Field: {gameDetails.fieldName}</p>
        <p>Date: {gameDetails.date.toLocaleDateString()}</p>
        <p>Time: {gameDetails.start_time}</p>
      </div>
      <div className={styles.playerList}>
        <p>Select the guys that will play (max {MAX_PLAYERS})</p>
        <p className={selectedPlayers.size > MAX_PLAYERS ? styles.error : ''}>
          {selectedPlayers.size}/{MAX_PLAYERS} players selected
        </p>
        {players.map(player => (
          <label 
            key={player.id} 
            className={`${styles.playerItem} ${selectedPlayers.size >= MAX_PLAYERS && !selectedPlayers.has(player.id) ? styles.disabled : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedPlayers.has(player.id)}
              onChange={() => handlePlayerToggle(player.id)}
              disabled={selectedPlayers.size >= MAX_PLAYERS && !selectedPlayers.has(player.id)}
            />
            {player.name}
          </label>
        ))}
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onBack} disabled={submitting}>Back</button>
        <button 
          onClick={handleSubmit} 
          disabled={!isValidTeamSize || submitting}
          className={!isValidTeamSize || submitting ? styles.buttonDisabled : ''}
        >
          {submitting ? 'Creating...' : 'Create Game'}
        </button>
      </div>
    </div>
  );
};

export default PlayerSelection;
