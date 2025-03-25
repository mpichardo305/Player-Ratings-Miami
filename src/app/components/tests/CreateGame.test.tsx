import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGame } from '../CreateGame';
import router from 'next/router';

// Mock Next.js router push
jest.mock('next/router', () => ({
  push: jest.fn(),
}));

// Mock DatePickerComponent with a simple input
jest.mock('../DatePickerComponent', () => {
  return function MockedDatePickerComponent({ selectedDate, onChange }: { selectedDate: Date | null; onChange: (date: Date) => void; }) {
    return (
      <input
        data-testid="mocked-date-picker"
        type="date"
        value={selectedDate ? selectedDate.toISOString().substring(0, 10) : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
      />
    );
  };
});

// Mock PlayerSelection from the parent folder
jest.mock('../PlayerSelection', () => {
  return function MockedPlayerSelection({ onSuccess, onBack }: { onSuccess: (gameId: string, readableId: string) => void; onBack: () => void; }) {
    return (
      <div data-testid="mocked-player-selection">
        <button data-testid="simulate-success" onClick={() => onSuccess('game123', 'readable123')}>
          Simulate Success
        </button>
        <button data-testid="simulate-back" onClick={onBack}>
          Simulate Back
        </button>
      </div>
    );
  };
});

// Mock GameCreationSuccess from the parent folder
jest.mock('../GameCreationSuccess', () => {
  return function MockedGameCreationSuccess({ gameId, readableId }: { gameId: string; readableId: string; }) {
    return (
      <div data-testid="mocked-game-success">
        Game Created: {gameId}, {readableId}
      </div>
    );
  };
});

describe('CreateGame component', () => {
  // Helper to get the select elements (there are 2: Field and Time)
  const getSelectElements = () => screen.getAllByRole('combobox');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial step (step 1) with form elements', () => {
    render(<CreateGame />);
    // Check heading and buttons
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    // Check date picker and selects (first select = Field, second select = Time)
    expect(screen.getByTestId('mocked-date-picker')).toBeInTheDocument();
    const selects = getSelectElements();
    expect(selects.length).toBe(2);
  });

  it('alerts when clicking Next without filling all fields', async () => {
    window.alert = jest.fn();
    render(<CreateGame />);
    await userEvent.click(screen.getByText('Next'));
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields');
  });

  it('resets the form when clicking Reset', async () => {
    render(<CreateGame />);
    const selects = getSelectElements();
    const fieldSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;
    const dateInput = screen.getByTestId('mocked-date-picker') as HTMLInputElement;

    // Simulate user selections and input
    await userEvent.selectOptions(fieldSelect, 'KSP');
    expect(fieldSelect.value).toBe('KSP');

    await userEvent.type(dateInput, '2025-03-25');
    expect(dateInput.value).toBe('2025-03-25');

    await userEvent.selectOptions(timeSelect, '9:00 AM');
    expect(timeSelect.value).toBe('9:00 AM');

    // Click Reset
    await userEvent.click(screen.getByText('Reset'));

    // Verify that fields are reset to default values
    expect(fieldSelect.value).toBe('');
    expect(timeSelect.value).toBe('');
    expect(dateInput.value).toBe('');
  });

  it('transitions to step 2 when all fields are filled and Next is clicked', async () => {
    render(<CreateGame />);
    const selects = getSelectElements();
    const fieldSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;
    const dateInput = screen.getByTestId('mocked-date-picker') as HTMLInputElement;

    // Fill all fields
    await userEvent.selectOptions(fieldSelect, 'KSP');
    await userEvent.type(dateInput, '2025-03-25');
    await userEvent.selectOptions(timeSelect, '9:00 AM');

    // Click Next
    await userEvent.click(screen.getByText('Next'));

    // Verify transition to step 2 by checking for the mocked PlayerSelection
    expect(await screen.findByTestId('mocked-player-selection')).toBeInTheDocument();
  });

  it('navigates back when Back button is clicked', async () => {
    render(<CreateGame />);
    await userEvent.click(screen.getByText('Back'));
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });

  it('transitions to step 3 when onSuccess is triggered from PlayerSelection', async () => {
    render(<CreateGame />);
    const selects = getSelectElements();
    const fieldSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;
    const dateInput = screen.getByTestId('mocked-date-picker') as HTMLInputElement;

    // Fill all fields and click Next
    await userEvent.selectOptions(fieldSelect, 'KSP');
    await userEvent.type(dateInput, '2025-03-25');
    await userEvent.selectOptions(timeSelect, '9:00 AM');
    await userEvent.click(screen.getByText('Next'));

    // Simulate game creation success from PlayerSelection
    const successButton = await screen.findByTestId('simulate-success');
    await userEvent.click(successButton);

    // Verify transition to step 3 by checking for the mocked GameCreationSuccess
    expect(await screen.findByTestId('mocked-game-success')).toBeInTheDocument();
  });
});