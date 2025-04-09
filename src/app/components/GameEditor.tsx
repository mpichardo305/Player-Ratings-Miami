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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

// Shared constants
const FIELD_OPTIONS = ['KSP', 'Tropical','Killian', 'Revo'];
const TIME_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '7:00 PM', '8:00 PM', '9:00 PM'];
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
    return <><div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="text-sm ml-2">Loading game details...</span>
    
  </div></>;
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
      <div className="min-h-screen bg p-4 relative">
      <h1 className="text-3xl font-bold text-white mb-4">Edit Game</h1>
      <PlayerSelection
        gameDetails={gameDetailsWithDates}
        onBack={handleBack}
        mode={mode === 'create' ? 'create' : 'update'}
        gameId={gameId}
        onSuccess={handleOperationSuccess}
      />
      
      </div>
    );
  }

  // Game details form (step 1)
  return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-foreground">
            {mode === 'create' ? 'Create New Game' : 'Edit Game'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="field-select" className="text-foreground">Field</Label>
              <Select
                value={selectedField}
                onValueChange={setSelectedField}
              >
                <SelectTrigger id="field-select" className="bg-secondary text-secondaryForeground">
                  <SelectValue placeholder="Select Field" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  {FIELD_OPTIONS.map(field => (
                    <SelectItem 
                      key={field} 
                      value={field} 
                      className="text-foreground"
                    >
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Card className="bg-secondary">
                <CardContent className="p-2">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Select date"
                    className="bg-secondary text-secondaryForeground w-full"
                    calendarClassName="bg-card border-primary"
                    dayClassName={() => "text-foreground"}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-select" className="text-foreground">Time</Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
              >
                <SelectTrigger id="time-select" className="bg-secondary text-secondaryForeground">
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem 
                      key={time} 
                      value={time} 
                      className="text-foreground"
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            {mode === 'edit' ? (
              <Button
                variant="secondary"
                onClick={handleCancel}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleReset}
                className="min-w-[100px]"
              >
                Reset
              </Button>
            )}
            {mode === 'create' ? (
              <Button
                variant="default"
                onClick={handleNext}
                className="min-w-[100px] bg-primary text-primaryForeground"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleSubmitGameDetails}
                className="min-w-[100px] bg-primary text-primaryForeground"
              >
                Save & Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

export default GameEditor;
