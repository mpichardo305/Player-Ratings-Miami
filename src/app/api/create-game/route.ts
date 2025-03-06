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
  console.log('🎮 Creating new game with data:', {
    fieldName: gameData.fieldName,
    date: gameData.date,
    start_time: gameData.start_time,
    group_id: gameData.group_id
  });

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Failed to create game:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to create game: ${response.statusText}`);
    }

    const createdGame = await response.json();
    console.log('✅ Game created successfully:', createdGame);
    return createdGame;

  } catch (error) {
    console.error('🚨 Error in createGame:', error);
    throw error;
  }
};


