import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnratedPlayersList from '../UnratedPlayersList';
import { supabase } from '@/app/utils/supabaseClient';
import { fetchGamePlayers } from '@/app/utils/playerDb';
import { hasGameEnded } from '@/app/utils/gameUtils';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis()
  }
}));

jest.mock('@/app/utils/playerDb', () => ({
  fetchGamePlayers: jest.fn()
}));

jest.mock('@/app/utils/gameUtils', () => ({
  hasGameEnded: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the fetch API
global.fetch = jest.fn();

// Fix the next/dynamic mock by making it return a component function directly
jest.mock('next/dynamic', () => {
  return jest.fn().mockImplementation((importFunc, options) => {
    const MockedComponent = (props: { player: any; onRate: any; isSelf: any; pendingRating: any; }) => {
      const { player, onRate, isSelf, pendingRating } = props;
      return (
        <div data-testid={`player-${player.id}`} className="player-item">
          <div>{player.name}</div>
          <div data-testid={`avg-rating-${player.id}`}>
            Rating: {player.avg_rating || 0}
          </div>
          {!isSelf && (
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  data-testid={`rate-${player.id}-${rating}`}
                  onClick={() => onRate(player.id, rating)}
                  className={pendingRating === rating ? 'selected' : ''}
                >
                  {rating}
                </button>
              ))}
            </div>
          )}
          {isSelf && <div>You cannot rate yourself</div>}
        </div>
      );
    };
    return MockedComponent;
  });
});

describe('UnratedPlayersList', () => {
  // Mock data
  const sessionUserId = 'user-123';
  const gameId = 'game-456';
  
  const mockPlayers = [
    { id: 'player-1', name: 'John Smith', status: 'active' },
    { id: 'player-2', name: 'Jane Doe', status: 'active' },
    { id: sessionUserId, name: 'Current User', status: 'active' }
  ];
  
  const mockGame = {
    id: gameId,
    date: '2025-03-22',
    start_time: '19:00'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Delay the resolution of game data so the loading state remains visible initially
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGame
    });
    
    // Delay fetchGamePlayers so it doesn't resolve immediately
    (fetchGamePlayers as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPlayers), 200))
    );
    
    (hasGameEnded as jest.Mock).mockReturnValue(true);
    
    // Mock Supabase responses
    const mockSupabaseFrom = supabase.from as jest.Mock;
    mockSupabaseFrom.mockImplementation(() => ({
      select: () => ({
        in: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      }),
      upsert: () => Promise.resolve({ data: [], error: null })
    }));
  });

  test('renders loading state initially', async () => {
    // Render the component
    render(<UnratedPlayersList sessionUserId={sessionUserId} gameId={gameId} />);
    
    // Immediately check for loading state.
    // We do not wait for the fetch to resolve so that the loading indicator is still present.
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);

    // Wait until the data is loaded (loading state is replaced)
    await waitFor(() => {
      // Check that at least one player item is rendered
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
    });
  });
});