'use client';

import { useParams, useRouter } from 'next/navigation';
import GameEditor from '@/app/components/GameEditor';
import { useState, useEffect } from 'react';
import { useSession } from "@/app/hooks/useSession";
import { useGroupAdmin } from '@/app/hooks/useGroupAdmin';

export default function ManagePlayersPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const session = useSession();
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', process.env.NEXT_PUBLIC_GROUP_ID ?? '');
  const router = useRouter();

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !isGroupAdmin) {
      console.log("Redirecting to view mode - not an admin");
      router.push(`/game/${gameId}?mode=view`);
    }
    setInitialLoad(false);
    setAdminCheckComplete(true);
  }, [initialLoad, adminCheckComplete, isGroupAdmin, gameId, router]);

  return <GameEditor mode="manage-players" gameId={gameId} />;
}
