import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import styles from '../CreateGame.module.css';
import Link from 'next/link';

interface GameOperationSuccessProps {
  gameId: string;
  readableId: string;
  mode: 'create' | 'update';
  onCreateNewGame?: () => void;
}

const GameOperationSuccess = ({ gameId, readableId, mode, onCreateNewGame }: GameOperationSuccessProps) => {
  const isCreate = mode === 'create';
  
  return (
    <div className={styles.successContainer}>
      <FaCheckCircle size={60} className={styles.successIcon} />
      <h1 style={{ fontSize: '1.8rem' }}>{isCreate ? 'Game Created Successfully!' : 'Players Updated Successfully!'}</h1>
      <p>{isCreate 
        ? 'Your game has been created and players have been assigned.'
        : 'The player roster for this game has been updated.'}
      </p>
      
      <div className={styles.gameDetails}>
        <p><strong>Game ID:</strong> {gameId}</p>
      </div>
      
      <div className={styles.actionButtons}>
        <Link href={`/game/${gameId}`} passHref>
          <button className={styles.primaryButton}>
            View Game Details
          </button>
        </Link>
        
        {isCreate && onCreateNewGame && (
          <button 
            onClick={onCreateNewGame}
            className={styles.secondaryButton}
          >
            Create Another Game
          </button>
        )}
        
        <Link href="/" passHref>
          <button className={styles.secondaryButton}>
            Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default GameOperationSuccess;
