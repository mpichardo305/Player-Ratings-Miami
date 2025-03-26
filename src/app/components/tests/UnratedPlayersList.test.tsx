import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnratedPlayersList from '../UnratedPlayersList';
import { supabase } from '@/app/utils/supabaseClient';
import { fetchGamePlayers } from '@/app/utils/playerDb';
import toast from 'react-hot-toast';

// Mock fetch for game API calls
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      id: 'game-456',
      date: '2024-03-25',
      start_time: '19:00:00',
      status: 'ended'
    })
  })
) as jest.Mock;

// Mock the modules
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn()
    }))
  }
}));

jest.mock('@/app/utils/playerDb', () => ({
  fetchGamePlayers: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn()
}));

describe('UnratedPlayersList', () => {
  const mockPlayerId = 'player-123';
  const mockGameId = 'game-456';
  const mockPlayers = [
    { id: mockPlayerId, name: 'Current Player', status: 'active' },
    { id: 'player-2', name: 'Player 2', status: 'active' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetchGamePlayers implementation
    (fetchGamePlayers as jest.Mock).mockResolvedValue(mockPlayers);
  });

  it('renders loading skeleton initially', () => {
    render(<UnratedPlayersList playerId={mockPlayerId} gameId={mockGameId} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('prevents rating when game has not ended', async () => {
    // Mock fetch to return a game that hasn't ended
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: mockGameId,
          status: 'in_progress'
        })
      })
    );

    render(<UnratedPlayersList playerId={mockPlayerId} gameId={mockGameId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/game hasn't ended yet/i)).toBeInTheDocument();
    });
  });

  it('prevents self-rating', async () => {
    render(<UnratedPlayersList playerId={mockPlayerId} gameId={mockGameId} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Find the rating buttons for the current player
    const currentPlayerStars = screen.getAllByRole('button', { 
      name: /rate current player/i 
    });
    
    // Try to rate self
    fireEvent.click(currentPlayerStars[0]);
    
    expect(screen.getByText(/you cannot rate your own performance/i)).toBeInTheDocument();
  });

  // Add more tests as needed...
});