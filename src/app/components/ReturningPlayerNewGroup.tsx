'use client'

import { useGroupName } from "../hooks/useGroupName";

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
          onClick={onConfirm}
          className="w-full md:w-auto px-8 py-3 bg-green-500 text-white rounded-lg 
                     hover:bg-green-600 transition-colors font-medium text-lg"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}