import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateGamePage from './page';
import GameEditor from '@/app/components/GameEditor';

// Import dependencies that need to be mocked
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import { checkPlayerMembership } from '@/app/db/checkUserQueries';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

// Mock Supabase auth
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

// Mock database queries
jest.mock('@/app/db/playerQueries', () => ({
  getGroupPlayers: jest.fn()
}));

// Mock the GameEditor component to isolate page testing
jest.mock('@/app/components/GameEditor', () => {
  return jest.fn().mockImplementation(({ players, groupId, onSubmit, onCancel }) => (
    <div data-testid="game-editor">
      <button data-testid="submit-game" onClick={() => onSubmit({
        name: 'Test Game',
        location: 'Test Location',
        date: '2025-03-23',
        players: players.slice(0, 2)
      })}>
        Create Game
      </button>
      <button data-testid="cancel-game" onClick={onCancel}>Cancel</button>
    </div>
  ));
});

describe('CreateGamePage', () => {
  // Define mock data for tests
  const groupId = 'group-123';
  const mockPlayers = [
    { id: 'player-1', name: 'John Doe', email: 'john@example.com' },
    { id: 'player-2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'player-3', name: 'Bob Johnson', email: 'bob@example.com' }
  ];
  
  // Set up mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock URL params
    (useParams as jest.Mock).mockReturnValue({ groupId });
    
    // Mock authentication
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } }
    });
    
    // Mock player data
    (checkPlayerMembership as jest.Mock).mockResolvedValue({
      data: mockPlayers,
      error: null
    });
  });

  test('renders loading state initially', async () => {
    render(<CreateGamePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('passes players to GameEditor component when loaded', async () => {
    render(<CreateGamePage />);
    
    await waitFor(() => {
      expect(GameEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          players: mockPlayers,
          groupId
        }),
        expect.anything()
      );
    });
  });

  test('shows error message when player loading fails', async () => {
    (checkPlayerMembership as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to load players' }
    });
    
    render(<CreateGamePage />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load players/i)).toBeInTheDocument();
    });
  });

  test('navigates to game page when GameEditor submits', async () => {
    const mockRouter = useRouter();
    
    render(<CreateGamePage />);
    
    // Wait for GameEditor to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('game-editor')).toBeInTheDocument();
    });
    
    // Simulate form submission from GameEditor
    fireEvent.click(screen.getByTestId('submit-game'));
    
    // Check that we navigate to the new game
    await waitFor(() => {
      // The exact URL depends on your implementation
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/games/'));
    });
  });

  test('navigates back when GameEditor cancels', async () => {
    const mockRouter = useRouter();
    
    render(<CreateGamePage />);
    
    // Wait for GameEditor to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('game-editor')).toBeInTheDocument();
    });
    
    // Simulate cancel from GameEditor
    fireEvent.click(screen.getByTestId('cancel-game'));
    
    // Check that we navigate back
    expect(mockRouter.back).toHaveBeenCalled();
  });
});