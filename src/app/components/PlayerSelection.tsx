import { useState, useEffect } from 'react';
import styles from '../CreateGame.module.css';
import { GameCreate } from './CreateGame';

interface Player {
  id: string;
  name: string;
}

interface PlayerSelectionProps {
  gameDetails: GameCreate;
  onBack: () => void;
}

const PlayerSelection = ({ gameDetails, onBack }: PlayerSelectionProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // TODO: Replace with actual API call to get players
    const mockPlayers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      // Add more mock players as needed
    ];
    setPlayers(mockPlayers);
  }, []);

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSubmit = async () => {
    // TODO: Implement the final game creation with selected players
    console.log('Selected players:', Array.from(selectedPlayers));
  };

  return (
    <div className={styles.playerSelection}>
      <h2>Select Players for your game</h2>
      <div className={styles.gameInfo}>
        <p>Field: {gameDetails.fieldName}</p>
        <p>Date: {gameDetails.date.toLocaleDateString()}</p>
        <p>Time: {gameDetails.time}</p>
      </div>
      <div className={styles.playerList}>
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
