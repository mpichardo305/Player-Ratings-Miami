'use client';

import { useParams } from 'next/navigation';
import GameEditor from '@/app/components/GameEditor';

export default function ManagePlayersPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  return <GameEditor mode="manage-players" gameId={gameId} />;
}
