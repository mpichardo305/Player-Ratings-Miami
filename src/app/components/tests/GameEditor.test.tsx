import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameEditor from '../GameEditor';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock DatePicker component
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ onChange, selected }: { onChange: (date: Date) => void, selected: Date | null }) {
    return (
      <input 
        data-testid="date-picker" 
        onChange={(e) => onChange(new Date(e.target.value))} 
        value={selected ? selected.toISOString().split('T')[0] : ''}
      />
    );
  };
});

// Mock PlayerSelection component
jest.mock('../PlayerSelection', () => {
  interface GameDetails {
    field?: string;
    date?: Date;
    time?: string;
  }
  
  return function MockPlayerSelection({ gameDetails, onBack, mode, gameId, onSuccess }: {
    gameDetails: GameDetails;
    onBack: () => void;
    mode: string;
    gameId?: string;
    onSuccess: (gameId: string, gameCode: string) => void;
  }) {
    return (
      <div data-testid="player-selection">
        <button data-testid="back" onClick={onBack}>Back</button>
        <button 
          data-testid="success" 
          onClick={() => onSuccess('game-123', 'GAME-123')}
        >
          Complete
        </button>
      </div>
    );
  };
});

// Mock Supabase client
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

describe('GameEditor', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  test('renders create mode form fields correctly', () => {
    render(<GameEditor mode="create" />);
    
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByText('Field')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('validates required fields before proceeding to next step', async () => {
    window.alert = jest.fn();
    
    render(<GameEditor mode="create" />);
    
    // Click Next without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    // Should show validation alert
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields');
  });

  test('proceeds to player selection when fields are filled', async () => {
    render(<GameEditor mode="create" />);
    
    // Find selects by their container
    const fieldSelect = screen.getByRole('combobox', { name: /field/i });
    
    // Find time select using a different approach
    const timeLabel = screen.getByText('Time');
    const formGroup = timeLabel.closest('.formGroup');
    // Get the select element within this group
    const timeSelect = formGroup?.querySelector('select');
    
    // Fill out the form
    fireEvent.change(fieldSelect, { target: { value: 'KSP' } });
    
    // Set date
    fireEvent.change(screen.getByTestId('date-picker'), {
      target: { value: '2025-03-23' }
    });
    
    // Set time
    if (timeSelect) {
      fireEvent.change(timeSelect, { target: { value: '7:00 PM' } });
    }
    
    // Click Next
    fireEvent.click(screen.getByText('Next'));
    
    // Should show player selection
    await waitFor(() => {
      expect(screen.getByTestId('player-selection')).toBeInTheDocument();
    });
  });

  test('shows success screen after player selection completes', async () => {
    render(<GameEditor mode="create" />);
    
    // Find selects by their containers
    const fieldSelect = screen.getByRole('combobox', { name: /field/i });
    
    // Find time select
    const timeLabel = screen.getByText('Time');
    const formGroup = timeLabel.closest('.formGroup');
    const timeSelect = formGroup?.querySelector('select');
    
    // Fill out form and go to next step
    fireEvent.change(fieldSelect, { target: { value: 'KSP' } });
    
    fireEvent.change(screen.getByTestId('date-picker'), {
      target: { value: '2025-03-23' }
    });
    
    if (timeSelect) {
      fireEvent.change(timeSelect, { target: { value: '7:00 PM' } });
    }
    
    fireEvent.click(screen.getByText('Next'));
    
    // Complete player selection
    await waitFor(() => {
      expect(screen.getByTestId('player-selection')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('success'));
    });
    
    // Should show success screen
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  test('resets form when Reset button is clicked', () => {
    render(<GameEditor mode="create" />);
    
    // Find selects
    const fieldSelect = screen.getByRole('combobox', { name: /field/i });
    
    // Find time select
    const timeLabel = screen.getByText('Time');
    const formGroup = timeLabel.closest('.formGroup');
    const timeSelect = formGroup?.querySelector('select');
    
    // Fill out form
    fireEvent.change(fieldSelect, { target: { value: 'KSP' } });
    
    fireEvent.change(screen.getByTestId('date-picker'), {
      target: { value: '2025-03-23' }
    });
    
    if (timeSelect) {
      fireEvent.change(timeSelect, { target: { value: '7:00 PM' } });
    }
    
    // Click Reset
    fireEvent.click(screen.getByText('Reset'));
    
    // Form should be reset - check that the first option (empty) is selected
    expect(fieldSelect).toHaveValue('');
    if (timeSelect) {
      expect(timeSelect).toHaveValue('');
    }
  });
});