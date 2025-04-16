import { Card, CardContent } from "@/components/ui/card";
import { formatDatePreserveDay, formatTimeOnly } from '../utils/dateUtils';

interface GameDetailsCardProps {
  fieldName: string;
  date: string;
  startTime: string;
  groupName?: string;
}

export function GameDetailsCard({ fieldName, date, startTime }: GameDetailsCardProps) {
  return (
    <Card className="bg-secondary border-secondary">
      <CardContent className="py-2">
        <div className="flex justify-between items-center gap-4 text-foreground text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Field:</span>
            <span>{fieldName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <span>{formatDatePreserveDay(date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Time:</span>
            <span>{formatTimeOnly(startTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}