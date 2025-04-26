'use client'

import { useGroupName } from "../hooks/useGroupName";
import { useSession } from "../hooks/useSession";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ReturningPlayerNewGroupProps {
  onConfirm: () => Promise<void>;
  groupId: string;
  playerName?: string;
}

export default function ReturningPlayerNewGroup({ 
  onConfirm, 
  groupId,
  playerName 
}: ReturningPlayerNewGroupProps) {
  const {groupName} = useGroupName(groupId);
  const session = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!session) {
      console.log('No session found');
      // You might want to handle this case, perhaps redirect to login
      return;
    }

    try {
      setIsLoading(true);
      localStorage.setItem('playerRatingsSession', JSON.stringify(session));
      await onConfirm();
    } catch (error) {
      console.error('Error during confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm space-y-6 text-center px-4">
        <h2 className="text-2xl font-semibold mb-4">Join New Group</h2>
        {playerName && (
          <p className="text-lg text-gray-200 mb-6">
            Welcome back, {playerName}!
          </p>
        )}
        <p className="text-lg text-gray-300 mb-8">
          You've been invited to join {groupName}
        </p>
        <button
          onClick={handleConfirm}
          disabled={isLoading || !session}
          className="w-full md:w-auto px-8 py-3 bg-green-500 text-white rounded-lg 
                   hover:bg-green-600 transition-colors font-medium text-lg
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              Processing...
            </span>
          ) : (
            'Confirm'
          )}
        </button>
      </div>
    </div>
  );
}