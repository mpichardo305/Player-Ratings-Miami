import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../CreateGame.module.css';
import PlayerSelection from './PlayerSelection';
import GameOperationSuccess from './GameOperationSuccess';
import { supabase } from '@/app/utils/supabaseClient';
import { createGame } from '../lib/gameService';
import { format, parseISO, parse } from 'date-fns';
import { formatDatePreserveDay, formatDatePreserveDayAndYear } from '../utils/dateUtils';

// Shared constants
const FIELD_OPTIONS = ['KSP', 'Killian', 'Revo'];
const TIME_OPTIONS = ['7:00 PM', '8:00 PM', '9:00 PM'];
const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e';

type GameEditorMode = 'create' | 'edit' | 'manage-players';

interface GameEditorProps {
  mode: GameEditorMode;
  gameId?: string;
}

interface Game {
  id: string;
  game_id: string;
  field_name: string;
  date: string;
  start_time: string;
  created_at?: Date;
  updated_at?: Date;
  group_id: string;
}

export const GameEditor = ({ mode, gameId }: GameEditorProps) => {
  const router = useRouter();
  const [step, setStep] = useState(mode === 'manage-players' ? 2 : 1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(mode !== 'create');
  const [error, setError] = useState<string | null>(null);
  const [createdGameId, setCreatedGameId] = useState<string>('');
  const [readableId, setReadableId] = useState<string>('');

  // Format utilities
  function formatDateForDisplay(date: Date | string): Date {
    return typeof date === 'string' ? new Date(date) : date;
  }
  
  function formatTimeFrom24Hour(time: string): string {
    // Convert from database time format to display format
    try {
      return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time; // If format is already correct or parsing fails, return as is
    }
  }
  
  // Updated: More robust time formatting function specifically for time type
  function formatTimeForDatabase(timeString: string): string {
    try {
      // Parse the time string (like "8:00 PM") to a Date object
      const parsedTime = parse(timeString, 'h:mm a', new Date());
      
      // Format to 24-hour time format for database (HH:MM:SS)
      const formattedTime = format(parsedTime, 'HH:mm:ss');
      console.log('Parsed time for database:', timeString, 'to', formattedTime);
      return formattedTime;
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      // Fallback conversion for AM/PM format
      if (timeString.includes('PM') || timeString.includes('AM')) {
        const [timePart, amPm] = timeString.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        let hour24 = hours;
        
        if (amPm === 'PM' && hours < 12) hour24 += 12;
        if (amPm === 'AM' && hours === 12) hour24 = 0;
        
        const formattedTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        console.log('Manual time format conversion:', timeString, 'to', formattedTime);
        return formattedTime;
      }
      
      return '00:00:00'; // Default as fallback
    }
  }

  // Fetch game details if we're in edit or manage-players mode
  useEffect(() => {
    if (mode === 'create' || !gameId) {
      setLoading(false);
      return;
    }

    async function fetchGameDetails() {
      try {
        setLoading(true);
        
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
        const preservedDateString = formatDatePreserveDayAndYear(data.date);
        // Set game state with converted date
        setGame({
          ...data,
          date: new Date(preservedDateString)
        });
        setReadableId(data.game_id);
        
        setSelectedField(data.field_name);
        setSelectedDate(new Date(preservedDateString));
        setSelectedTime(formatTimeFrom24Hour(data.start_time));
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchGameDetails();
  }, [gameId, mode]);

  const handleReset = () => {
    if (mode === 'create') {
      setSelectedDate(null);
      setSelectedField('');
      setSelectedTime('');
    } else {
      // For edit mode, reset to original values
      if (game) {
        setSelectedField(game.field_name);
        setSelectedDate(new Date(game.date));
        setSelectedTime(formatTimeFrom24Hour(game.start_time));
      }
    }
  };
  const handleCancel = () => {
    if (mode =='edit') {
      router.push(`/game/${gameId}?mode=view`);
    }
  }
  const handleNext = () => {
    if (!selectedDate || !selectedField || !selectedTime) {
      alert('Please fill in all fields');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (mode === 'manage-players') {
      router.push(`/game/${gameId}`);
    } else {
      setStep(1);
    }
  };

  const handleSubmitGameDetails = async () => {
    try {
      if (!selectedDate || !selectedField || !selectedTime) {
        setError('Please fill in all fields');
        return;
      }
      
      if (mode === 'create') {
        // New game creation flow remains unchanged
        setStep(2); // Move to player selection
      } else {
        // Update existing game
        if (!gameId) {
          setError('Missing game ID');
          return;
        }

        // Convert selected time to database format with additional logging
        const formattedTime = formatTimeForDatabase(selectedTime);
        
        console.log('Submitting update with time:', {
          original: selectedTime,
          formatted: formattedTime,
          date: selectedDate?.toISOString()
        });

        const response = await fetch(`/api/games/${gameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field_name: selectedField,
            date: selectedDate?.toISOString(),
            start_time: formattedTime,
            created_at: game?.created_at,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to update game: ${JSON.stringify(errorData)}`);
        }

        // After successful update, move to player selection or success screen
        if (mode === 'edit') {
          setStep(2); // Move to player selection for edit mode
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to save game details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleOperationSuccess = (gameId: string, readableId: string) => {
    setCreatedGameId(gameId);
    setReadableId(readableId);
    setStep(3);
  };

  const handleCreateNewGame = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedField('');
    setSelectedTime('');
    router.push('/create-game');
  };

  if (loading) {
    return <div className={styles.container}>Loading game details...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >Return Home</button>
      </div>
    );
  }

  // Success screen
  if (step === 3) {
    return (
      <GameOperationSuccess
        gameId={createdGameId || gameId || ''}
        readableId={readableId}
        mode={mode === 'create' ? 'create' : 'update'}
        onCreateNewGame={mode === 'create' ? handleCreateNewGame : undefined}
      />
    );
  }

  // Player selection screen
  if (step === 2) {
    const gameDetails = mode === 'create'
      ? {
          id: '',
          field_name: selectedField,
          date: selectedDate!.toISOString(),
          start_time: selectedTime,
          created_at: new Date(),
          updated_at: new Date(),
          group_id: GROUP_ID,
        }
      : {
          ...game!,
          date: new Date(game!.date).toISOString()
        };

    // Before passing gameDetails to PlayerSelection, ensure created_at and updated_at are set:
    const gameDetailsWithDates = {
      ...gameDetails,
      created_at: gameDetails.created_at || new Date(),
      updated_at: gameDetails.updated_at || new Date()
    };

    return (
      <div className="min-h-screen bg-gray-600 p-4 relative">
      <h1 className="text-3xl font-bold text-white mb-4">Edit Game</h1>
      <PlayerSelection
        gameDetails={gameDetailsWithDates}
        onBack={handleBack}
        mode={mode === 'create' ? 'create' : 'update'}
        gameId={gameId}
        onSuccess={handleOperationSuccess}
      />
      <button
        onClick={() => router.push('/dashboard')}
        className="back-button"
      >
        <span>Cancel</span>
      </button>
      </div>
    );
  }

  // Game details form (step 1)
  return (
    <div className={styles.container}>
      <h2 className="text-2xl font-bold mb-6 text-white">{mode === 'create' ? 'Create New Game' : 'Edit Game'}</h2>
      
      <div className={styles.formGroup}>
        <label>Field</label>
        <select 
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="w-full p-2 bg-[#4B5563] text-white border border-[#4B5563] rounded focus:outline-none focus:border-gray-400"
        >
          <option value="">Select Field</option>
          {FIELD_OPTIONS.map(field => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="MMMM d, yyyy"
          placeholderText="Select date"
          className="w-full p-2 bg-[#4B5563] text-white border border-[#4B5563] rounded focus:outline-none focus:border-gray-400"
          calendarClassName="bg-[#374151] border-[#4B5563]"
          dayClassName={() => "text-white"}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Time</label>
        <select 
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="w-full p-2 bg-[#4B5563] text-white border border-[#4B5563] rounded focus:outline-none focus:border-gray-400"
        >
          <option value="">Select Time</option>
          {TIME_OPTIONS.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between mt-8">
        {mode === 'edit' ? (
        <button 
          onClick={handleCancel}
          className="px-4 py-2 bg-[#4B5563] text-white rounded hover:bg-gray-600"
        >Cancel</button>
        ) : (
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-[#4B5563] text-white rounded hover:bg-gray-600"
          >Reset</button>
        )}
        {mode === 'create' ? (
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >Next</button>
        ) : (
          <button 
            onClick={handleSubmitGameDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >Save & Continue</button>
        )}
      </div>
    </div>
  );
};

export default GameEditor;
