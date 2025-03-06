const BASE_URL = '/api/games'; // review this

export interface GamePlayers {
  players: string[];
}

export interface Game {
  id: string;
}
export const updateGamePlayers = async (gameId: string, players: GamePlayers): Promise<Game> => {
  const response = await fetch(`${BASE_URL}/${gameId}/players`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(players),
  });

  if (!response.ok) {
    throw new Error('Failed to update game players');
  }

  return response.json();
}