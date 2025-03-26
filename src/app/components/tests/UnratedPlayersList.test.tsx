import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnratedPlayersList from '../UnratedPlayersList';
import { supabase } from '@/app/utils/supabaseClient';
import { fetchGamePlayers } from '@/app/utils/playerDb';
import toast from 'react-hot-toast';

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
    { id: 'player-1', name: 'Player 1', status: 'active' },
    { id: 'player-2', name: 'Player 2', status: 'active' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetchGamePlayers implementation
    (fetchGamePlayers as jest.Mock).mockResolvedValue(mockPlayers);
  });

  it('renders loading state initially', () => {
    render(<UnratedPlayersList playerId={mockPlayerId} gameId={mockGameId} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error when user tries to rate themselves', async () => {
    render(<UnratedPlayersList playerId={mockPlayerId} gameId={mockGameId} />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Simulate rating self
    fireEvent.click(screen.getByTestId(`rate-${mockPlayerId}`));
    
    expect(screen.getByText(/cannot rate yourself/i)).toBeInTheDocument();
  });

  // Add more tests as needed...
});