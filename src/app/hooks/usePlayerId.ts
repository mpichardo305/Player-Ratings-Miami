import { useState, useEffect } from "react";
import { useSession }          from "./useSession";
import { getUserPlayerId }     from "@/app/utils/playerDb";

export function usePlayerId(): { playerId: string; loading: boolean } {
  const session = useSession();
  const user = session?.user;

  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    getUserPlayerId(user.id)
      .then(id => setPlayerId(id ?? ""))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  return { playerId, loading };
}