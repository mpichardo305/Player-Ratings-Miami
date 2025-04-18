'use client';

import GameEditor from '@/app/components/GameEditor';
import { useState, useEffect } from 'react';
import { useSession } from "@/app/hooks/useSession";
import { useRouter } from 'next/navigation'; // Note: using next/navigation instead of next/router
import { useGroup } from '@/app/context/GroupContext';

export default function CreateGamePage() {
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const session = useSession();
  const { isCurrentGroupAdmin } = useGroup();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !isCurrentGroupAdmin) {
      console.log("Redirecting - not an admin");
      router.push('/'); // Redirect to home or games list
    }
    setInitialLoad(false);
    setAdminCheckComplete(true);
  }, [initialLoad, adminCheckComplete, isCurrentGroupAdmin, router]);

  return <GameEditor mode="create" />;
}
