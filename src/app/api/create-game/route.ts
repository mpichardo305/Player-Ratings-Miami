const BASE_URL = '/api/games'; // review this

export interface GameCreate {
  fieldName: string;
  date: Date;
  start_time: string;
  created_at: Date;
  updated_at: Date;
  group_id: string;
}


export interface Game extends GameCreate {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createGame = async (gameData: GameCreate): Promise<Game> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    throw new Error('Failed to create game');
  }

  return response.json();
};


