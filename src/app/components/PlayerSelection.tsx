import { useState, useEffect } from 'react';
import styles from '../CreateGame.module.css';
import { v4 as uuidv4 } from 'uuid';
import { updateGamePlayers } from '../lib/updateGamePlayersService';
import { createGame, GameCreate } from '../lib/gameService';  
import { formatDateOnly, formatTimeOnly } from '../utils/dateUtils';
import { Player, fetchGroupPlayers, fetchExistingPlayerIds } from '../utils/playerDb';

interface PlayerSelectionProps {
  gameDetails: GameCreate;
  onBack: () => void;
  mode: 'create' | 'update';
  gameId?: string;
  onSuccess?: (gameId: string, readableId: string) => void;
}

const PlayerSelection = ({ gameDetails, onBack, mode = 'create', gameId = '', onSuccess }: PlayerSelectionProps) => {
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
      const approvedPlayers = await fetchGroupPlayers(GROUP_ID);
      setPlayers(approvedPlayers);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPlayers = async () => {
    if (mode !== 'update' || !gameId) return;
    
    try {
      const existingPlayerIds = await fetchExistingPlayerIds(gameId);
      if (existingPlayerIds.length > 0) {
        setSelectedPlayers(new Set(existingPlayerIds));
      }
    } catch (error) {
      console.error('Error loading existing players:', error);
    }
  };

  useEffect(() => {
    fetchPlayers();
    if (mode === 'update' && gameId) {
      loadExistingPlayers();
    }
  }, [mode, gameId]);

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
  };

  const handleSubmit = async () => {
    // Only proceed if we have a valid number of players
    try {
      setSubmitting(true);
      
      if (mode === 'create') {
        // Generate game IDs first
        const { uuid, readableId } = genGameId();
        
        // Update game details with the generated IDs
        const gameWithIds = {
          ...gameDetails,
          id: uuid,
          game_id: readableId
        };
        
        // Call the createGame API with the game details including IDs
        const gameCreationResponse = await createGame(gameWithIds);
        
        // Now update the game players with the same game UUID
        const updateResponse = await updateGamePlayers(uuid, { players: Array.from(selectedPlayers) });
        
        // Call success callback instead of alert
        if (onSuccess) {
          onSuccess(uuid, readableId);
        }
      } else if (mode === 'update' && gameId) {
        // Just update the players for existing game
        const updateResponse = await updateGamePlayers(gameId, { players: Array.from(selectedPlayers) });
        
        // Call success callback if provided
        if (onSuccess) {
          // We use gameId twice since we don't have readableId in update mode
          onSuccess(gameId, gameDetails.id || '');
        }
      }
      
    } catch (error) {
      console.error('Error managing game players:', error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Failed: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValidTeamSize = selectedPlayers.size <= MAX_PLAYERS;
  const buttonText = mode === 'create' ? 'Create Game' : 'Update Players';
  const submittingText = mode === 'create' ? 'Creating...' : 'Updating...';

  return (
    <div className={styles.playerList}>
      <h2>{mode === 'create' ? 'Game Details' : 'Update Game Players'}</h2>
      <div className={styles.gameInfo}>
        <p>Field: {gameDetails.field_name}</p>
        <p>Date: {`${formatDateOnly(gameDetails.date)}`}</p>
        <p>Start Time: {`${formatTimeOnly(gameDetails.start_time)}`}</p>
      </div>
      <div className={styles.playerList}>
        <p>Select the guys that will play (max {MAX_PLAYERS})</p>
        <p className={selectedPlayers.size > MAX_PLAYERS ? styles.error : ''}>
          {selectedPlayers.size}/{MAX_PLAYERS} players selected
        </p>
        {loading ? (
          <p>Loading players...</p>
        ) : (
          players.map(player => (
            <label 
              key={player.id} 
              className={`${styles.playerItem} ${selectedPlayers.has(player.id) ? styles.selectedPlayer : ''} ${selectedPlayers.size >= MAX_PLAYERS && !selectedPlayers.has(player.id) ? styles.disabled : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedPlayers.has(player.id)}
                onChange={() => handlePlayerToggle(player.id)}
                disabled={selectedPlayers.size >= MAX_PLAYERS && !selectedPlayers.has(player.id)}
              />
              <span>{player.name}</span>
            </label>
          ))
        )}
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onBack} disabled={submitting}>Back</button>
        <button 
          onClick={handleSubmit} 
          disabled={!isValidTeamSize || submitting}
          className={!isValidTeamSize || submitting ? styles.buttonDisabled : ''}
        >
          {submitting ? submittingText : buttonText}
        </button>
      </div>
    </div>
  );
};

export default PlayerSelection;
