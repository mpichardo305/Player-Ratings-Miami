import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    // Create a component that will be returned by dynamic
    const MockedComponent = (props: { player: any; onRate: any; isSelf: any; pendingRating: any; }) => {
      // This simulates what PlayerItem would do
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
    { id: sessionUserId, name: 'Current User', status: 'active' } // This player is the current user
  ];
  
  const mockGame = {
    id: gameId,
    date: '2025-03-22',
    start_time: '19:00'
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for game data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGame
    });
    
    // Default mock implementations
    (fetchGamePlayers as jest.Mock).mockResolvedValue(mockPlayers);
    (hasGameEnded as jest.Mock).mockReturnValue(true); // Game has ended by default
    
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

  // Keep the test implementations as they were before
  
  // For "loading state initially" test, we may need to simplify:
  test('renders loading state initially', () => {
    render(<UnratedPlayersList sessionUserId={sessionUserId} gameId={gameId} />);
      // Find loading elements (the pulse animation placeholders)
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
  });

  // Rest of tests should work after the dynamic mock fix
});