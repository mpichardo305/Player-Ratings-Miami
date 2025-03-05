import { GameCreate, Game } from '../types/game';

const BASE_URL = '/api/games';

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
