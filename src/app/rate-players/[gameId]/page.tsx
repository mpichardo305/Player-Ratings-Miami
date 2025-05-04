
import { RatePlayersClient } from "@/app/components/RatePlayersClient";

type Game = {
  id: string;
  date: string;
  start_time: string;
  field_name?: string;
};
// Server Component
async function RatePlayersPage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;

  // Fetch game data on the server
  const game = await fetchGameDetails(gameId);

  return (
    <RatePlayersClient game={game} gameId={gameId} />
  );
}

async function fetchGameDetails(gameId: string): Promise<Game | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/api/games/${gameId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game details');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game:', error);
    return null;
  }
}

export default RatePlayersPage;
