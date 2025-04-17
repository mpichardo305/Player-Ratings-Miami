'use client';

import GameEditor from '@/app/components/GameEditor';
import { useState, useEffect } from 'react';
import { useSession } from "@/app/hooks/useSession";
import { useRouter } from 'next/router';
import { useGroupAdmin } from '@/app/hooks/useGroupAdmin';

export default function CreateGamePage() {
  const [initialLoad, setInitialLoad] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const session = useSession();
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', process.env.NEXT_PUBLIC_GROUP_ID ?? '');
  const router = useRouter();

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !isGroupAdmin) {
      console.log("Redirecting - not an admin");
      router.push('/'); // Redirect to home or games list
    }
    setInitialLoad(false);
    setAdminCheckComplete(true);
  }, [initialLoad, adminCheckComplete, isGroupAdmin, router]);

  return <GameEditor mode="create" />;
}
