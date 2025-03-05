import { useState, useEffect, useRef } from 'react';
import styles from '../CreateGame.module.css';
import { GameCreate } from './CreateGame';
import { supabase } from "@/app/utils/supabaseClient";


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
  const previousPlayersRef = useRef<Player[]>([]);
  const isInitialFetchRef = useRef(true);
  const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'

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
    return () => {
      // Cleanup
      previousPlayersRef.current = [];
    };
  }, []);

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
    
    // Update players when selection changes
    setPlayers(prevPlayers => prevPlayers.map(player => ({
      ...player,
      selected: newSelected.has(player.id)
    })));
  };

  const handleSubmit = async () => {
    // TODO: Implement the final game creation with selected players
    console.log('Selected players:', Array.from(selectedPlayers));
  };

  return (
    <div className={styles.playerSelection}>
      <h2>Game Details</h2>
      <div className={styles.gameInfo}>
        <p>Field: {gameDetails.fieldName}</p>
        <p>Date: {gameDetails.date.toLocaleDateString()}</p>
        <p>Time: {gameDetails.time}</p>
      </div>
      <div className={styles.playerList}>
      <p>Select the guys that will play</p>
        {players.map(player => (
          <label key={player.id} className={styles.playerItem}>
            <input
              type="checkbox"
              checked={selectedPlayers.has(player.id)}
              onChange={() => handlePlayerToggle(player.id)}
            />
            {player.name}
          </label>
        ))}
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onBack}>Back</button>
        <button onClick={handleSubmit}>Create Game</button>
      </div>
    </div>
  );
};

export default PlayerSelection;
