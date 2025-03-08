import { useRouter } from 'next/navigation';
import styles from '../CreateGame.module.css';

interface GameCreationSuccessProps {
  gameId: string;
  readableId: string;
  fieldName: string;
  date: Date;
  startTime: string;
}

const GameCreationSuccess = ({ 
  gameId, 
  readableId, 
  fieldName, 
  date, 
  startTime 
}: GameCreationSuccessProps) => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleEditPlayers = () => {
    router.push(`/manage-players/${gameId}`);
  };

  return (
    <div className={styles.successContainer}>
      <div className={styles.successIcon}>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      
      <h2>Game Created Successfully!</h2>
      
      <div className={styles.gameDetails}>
        <p><strong>Game ID:</strong> {readableId}</p>
        <p><strong>Field:</strong> {fieldName}</p>
        <p><strong>Date:</strong> {date.toLocaleDateString()}</p>
        <p><strong>Time:</strong> {startTime}</p>
      </div>
      
      <div className={styles.actionButtons}>
        <button 
          className={styles.primaryButton} 
          onClick={handleEditPlayers}
        >
          Add/Edit Players
        </button>
        <button 
          className={styles.secondaryButton} 
          onClick={handleGoHome}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default GameCreationSuccess;
