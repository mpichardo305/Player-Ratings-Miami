import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerSelection from '../PlayerSelection';

// Import modules that will be mocked
import { fetchGroupPlayers, fetchExistingPlayerIds } from '@/app/utils/playerDb';
import { createGame } from '@/app/lib/gameService';
import { updateGamePlayers } from '@/app/lib/updateGamePlayersService';

// Mock the API functions
jest.mock('@/app/utils/playerDb', () => ({
  fetchGroupPlayers: jest.fn(),
  fetchExistingPlayerIds: jest.fn()
}));

jest.mock('@/app/lib/gameService', () => ({
  createGame: jest.fn()
}));

jest.mock('@/app/lib/updateGamePlayersService', () => ({
  updateGamePlayers: jest.fn()
}));

describe('PlayerSelection Component', () => {
  // Mock data
  const mockPlayers = [
    { id: 'player-1', name: 'John Smith', email: 'john@example.com' },
    { id: 'player-2', name: 'Alex Johnson', email: 'alex@example.com' },
    { id: 'player-3', name: 'Maria Garcia', email: 'maria@example.com' },
    { id: 'player-4', name: 'Kevin Wong', email: 'kevin@example.com' }
  ];
  
  const mockGameDetails = {
    id: 'mock-game-id',
    field_name: 'KSP',
    date: new Date('2025-03-23'),
    start_time: '7:00 PM',
    group_id: '299af152-1d95-4ca2-84ba-43328284c38e'
  };
  
  const mockOnBack = jest.fn();
  const mockOnSuccess = jest.fn();

  // Reset mocks before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Default mock implementations - wrapping in waitFor to ensure they resolve
    (fetchGroupPlayers as jest.Mock).mockResolvedValue(mockPlayers);
    (fetchExistingPlayerIds as jest.Mock).mockResolvedValue([]);
    (createGame as jest.Mock).mockResolvedValue({ success: true });
    (updateGamePlayers as jest.Mock).mockResolvedValue({ success: true });
    
    // Wait for all promises to resolve before proceeding with tests
    await waitFor(() => {
      expect(fetchGroupPlayers).toBeDefined();
      expect(fetchExistingPlayerIds).toBeDefined();
    });
  });

  test('renders loading state initially', () => {
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    expect(screen.getByText('Loading players...')).toBeInTheDocument();
  });

  test('displays players after loading', async () => {
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    // Wait for players to load
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    // Check if player names are displayed
    mockPlayers.forEach(player => {
      expect(screen.getByText(player.name)).toBeInTheDocument();
    });
  });

  test('allows selecting and deselecting players', async () => {
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    // Wait for players to load
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    // Initial state: 0 players selected
    expect(screen.getByText('0/12 players selected')).toBeInTheDocument();
    
    // Select a player and wait for state to update
    fireEvent.click(screen.getByText('John Smith'));
    await waitFor(() => {
      expect(screen.getByText('1/12 players selected')).toBeInTheDocument();
    });
    
    // Select another player and wait for state to update
    fireEvent.click(screen.getByText('Alex Johnson'));
    await waitFor(() => {
      expect(screen.getByText('2/12 players selected')).toBeInTheDocument();
    });
    
    // Deselect a player and wait for state to update
    fireEvent.click(screen.getByText('John Smith'));
    await waitFor(() => {
      expect(screen.getByText('1/12 players selected')).toBeInTheDocument();
    });
  });

  test('creates a game when form is submitted in create mode', async () => {
    // Mock UUID for testing
    jest.mock('uuid', () => ({
      v4: () => 'test-uuid'
    }));

    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    // Wait for players to load
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    // Select players
    fireEvent.click(screen.getByText('John Smith'));
    fireEvent.click(screen.getByText('Alex Johnson'));
    
    // Submit form
    fireEvent.click(screen.getByText('Create Game'));
    
    // Check if API was called
    await waitFor(() => {
      expect(createGame).toHaveBeenCalled();
      expect(updateGamePlayers).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('updates players when form is submitted in update mode', async () => {
    const gameId = 'existing-game-id';
    
    render(
      <PlayerSelection 
        gameDetails={{...mockGameDetails, id: 'G-1234'}}
        onBack={mockOnBack}
        mode="update"
        gameId={gameId}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Wait for players to load
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    // Check if fetchExistingPlayerIds was called
    expect(fetchExistingPlayerIds).toHaveBeenCalledWith(gameId);
    
    // Select players
    fireEvent.click(screen.getByText('John Smith'));
    
    // Submit form
    fireEvent.click(screen.getByText('Update Players'));
    
    // Check if API was called
    await waitFor(() => {
      expect(updateGamePlayers).toHaveBeenCalledWith(gameId, { players: ['player-1'] });
      expect(mockOnSuccess).toHaveBeenCalledWith(gameId, 'G-1234');
    });
  });

  test('loads existing selected players in update mode', async () => {
    const gameId = 'existing-game-id';
    (fetchExistingPlayerIds as jest.Mock).mockResolvedValue(['player-1', 'player-2']);
    
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="update"
        gameId={gameId}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Wait for players to load and existing players to be selected
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
      expect(screen.getByText('2/12 players selected')).toBeInTheDocument();
    });
    
    // Check selected players differently - verify selected players count instead
    expect(screen.getByText('2/12 players selected')).toBeInTheDocument();
    
    // Alternative approach if your component uses data-testid attributes
    // expect(screen.getByTestId('player-player-1')).toHaveAttribute('data-selected', 'true');
    // expect(screen.getByTestId('player-player-2')).toHaveAttribute('data-selected', 'true');
  });

  test('prevents selecting more than max allowed players', async () => {
    // Create a lot of mock players to test the limit
    const manyPlayers = Array.from({ length: 15 }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      email: `player${i}@example.com`
    }));
    
    (fetchGroupPlayers as jest.Mock).mockResolvedValue(manyPlayers);
    
    // Either mock window.alert or check for disabled state
    window.alert = jest.fn();
    
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    // Select 12 players (the maximum)
    for (let i = 0; i < 12; i++) {
      fireEvent.click(screen.getByText(`Player ${i}`));
      // Wait for each click to register to avoid race conditions
      if (i < 11) {
        await waitFor(() => {
          expect(screen.getByText(`${i+1}/12 players selected`)).toBeInTheDocument();
        });
      }
    }
    
    // Verify 12 players are selected
    await waitFor(() => {
      expect(screen.getByText('12/12 players selected')).toBeInTheDocument();
    });
    
    // Try to select one more and check behavior
    fireEvent.click(screen.getByText('Player 12'));
    await waitFor(() => {
      // Count should still be 12 since we're at the limit
      expect(screen.getByText('12/12 players selected')).toBeInTheDocument();
    });
  });

  test('calls onBack when Back button is clicked', async () => {
    render(
      <PlayerSelection 
        gameDetails={mockGameDetails}
        onBack={mockOnBack}
        mode="create"
        onSuccess={mockOnSuccess}
      />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading players...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});