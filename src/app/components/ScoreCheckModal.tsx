import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ScoreCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNo: () => void;
  gameId: string; // Add gameId prop
}

export function ScoreCheckModal({ isOpen, onClose, onNo, gameId }: ScoreCheckModalProps) {
  const router = useRouter();
  const storageKey = `hasConfirmedScore_${gameId}`; // Create unique key for each game
  const [hasConfirmedScore, setHasConfirmedScore] = useLocalStorage(storageKey, false);

  const handleYesClick = () => {
    setHasConfirmedScore(true);
    onClose();
  };

  const handleNoClick = () => {
    onNo();
    router.push("/submit-score"); // Replace with your actual score submission route
  };

  // Don't show modal if user has already confirmed for this specific game
  if (hasConfirmedScore) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Did you submit the score already?</DialogTitle>
          <DialogDescription>
            Please submit score before you submit the ratings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={handleYesClick} variant="secondary">
            Yes, I did that already
          </Button>
          <Button onClick={handleNoClick} variant="default">
            No, I forgot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}