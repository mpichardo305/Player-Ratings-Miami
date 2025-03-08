import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../CreateGame.module.css';
import PageBackground from './PageBackground';
import PlayerSelection from './PlayerSelection';
import GameCreationSuccess from './GameCreationSuccess';

const FIELD_OPTIONS = ['KSP', 'Killian', 'Revo'];
const TIME_OPTIONS = ['7:00 PM', '8:00 PM', '9:00 PM'];
const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'


export const CreateGame = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [createdGameId, setCreatedGameId] = useState<string>('');
  const [createdGameReadableId, setCreatedGameReadableId] = useState<string>('');

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedField('');
    setSelectedTime('');
  };

  const handleNext = async () => {
    if (!selectedDate || !selectedField || !selectedTime) {
      alert('Please fill in all fields');
      return;
    }
    setStep(2);
  };

  const handleGameCreated = (gameId: string, readableId: string) => {
    setCreatedGameId(gameId);
    setCreatedGameReadableId(readableId);
    setStep(3);
  };

  return (    
    <div className={styles.container}>
      {step === 1 ? (
        <>
          <h2>Create New Game</h2>
          
          <div className={styles.formGroup}>
            <label>Field</label>
            <select 
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
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
            />
          </div>

          <div className={styles.formGroup}>
            <label>Time</label>
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="">Select Time</option>
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={handleReset}>Reset</button>
            <button onClick={handleNext}>Next</button>
          </div>
        </>
      ) : step === 2 ? (
        <PlayerSelection 
          gameDetails={{
            id: '',
            field_name: selectedField,
            date: selectedDate!,
            start_time: selectedTime,
            created_at: new Date(),
            updated_at: new Date(),
            group_id: GROUP_ID,
          }}
          onBack={() => setStep(1)}
          mode="create"
          onSuccess={handleGameCreated}
        />
      ) : (
        <GameCreationSuccess
          gameId={createdGameId}
          readableId={createdGameReadableId}
          fieldName={selectedField}
          date={selectedDate!}
          startTime={selectedTime}
        />
      )}
    </div>
  );
};
