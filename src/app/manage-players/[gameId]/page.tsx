'use client';

import { useParams, useRouter } from 'next/navigation';
import GameEditor from '@/app/components/GameEditor';
import { useState, useEffect } from 'react';
import { useSession } from "@/app/hooks/useSession";
import { useGroup } from '@/app/context/GroupContext';

export default function ManagePlayersPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const session = useSession();
  const { isCurrentGroupAdmin } = useGroup();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !isCurrentGroupAdmin) {
      console.log("Redirecting to view mode - not an admin");
      router.push(`/game/${gameId}?mode=view`);
    }
    setInitialLoad(false);
    setAdminCheckComplete(true);
  }, [initialLoad, adminCheckComplete, isCurrentGroupAdmin, gameId, router]);

  return <GameEditor mode="manage-players" gameId={gameId} />;
}
