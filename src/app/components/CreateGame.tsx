import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGroup } from '@/app/context/GroupContext';
import DatePickerComponent from './DatePickerComponent';
import PlayerSelection from './PlayerSelection';
import GameCreationSuccess from './GameCreationSuccess';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const FIELD_OPTIONS = ['KSP', 'Tropical','Killian', 'Revo'];
const TIME_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '7:00 PM', '8:00 PM', '9:00 PM'];

export const CreateGame = () => {
  const router = useRouter();
  const { currentGroup } = useGroup();
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
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-card">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="field-select">Field</Label>
                <Select
                  value={selectedField}
                  onValueChange={setSelectedField}
                >
                  <SelectTrigger id="field-select" className="bg-secondary border-input focus:ring-primary">
                    <SelectValue placeholder="Select Field" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    {FIELD_OPTIONS.map(field => (
                      <SelectItem 
                        key={field} 
                        value={field}
                        className="focus:bg-primary focus:text-primary-foreground"
                      >
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <DatePickerComponent
                  selectedDate={selectedDate}
                  onChange={(date) => setSelectedDate(date ?? null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-select">Time</Label>
                <Select
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                >
                  <SelectTrigger id="time-select" className="bg-secondary border-input focus:ring-primary">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    {TIME_OPTIONS.map(time => (
                      <SelectItem 
                        key={time} 
                        value={time}
                        className="focus:bg-primary focus:text-primary-foreground"
                      >
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="flex justify-between mt-6">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="min-w-[100px]"
                >
                  Reset
                </Button>
                <Button
                  variant="default"
                  onClick={handleNext}
                  className="min-w-[100px]"
                >
                  Next
                </Button>
              </div>
            </CardContent>
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
              group_id: currentGroup?.id || '', // Use currentGroup from context
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
      </Card>
      
      <div className="flex justify-start">
        <Button
        onClick={() => router.push('/dashboard')}
        variant="ghost"
        className="border border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground"
      >
        Back
      </Button>
      </div>
    </div>
  );
};
