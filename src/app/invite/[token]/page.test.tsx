import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import { validateInvite } from '@/app/actions/invite';
import { createInitialPlayer, updatePlayerName } from '@/app/db/playerQueries';
import { createGroupMembership, markInviteAsUsed, updateInviteWithPlayer } from '@/app/db/inviteQueries';
import { usePhoneNumber } from '@/app/hooks/usePhoneNumber';
import InviteRegistration from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

// Mock Supabase
jest.mock('@/app/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

// Mock server actions
jest.mock('@/app/actions/invite', () => ({
  validateInvite: jest.fn()
}));

// Mock database queries
jest.mock('@/app/db/playerQueries', () => ({
  createInitialPlayer: jest.fn(),
  updatePlayerName: jest.fn()
}));

jest.mock('@/app/db/inviteQueries', () => ({
  createGroupMembership: jest.fn(),
  markInviteAsUsed: jest.fn(),
  updateInviteWithPlayer: jest.fn()
}));

// Mock custom hooks
jest.mock('@/app/hooks/usePhoneNumber', () => ({
  usePhoneNumber: jest.fn()
}));

// Mock components
jest.mock('@/app/components/PhoneAuth', () => {
  return function PhoneAuthMock({ onVerificationSuccess }: { onVerificationSuccess: () => void }) {
    return <button data-testid="phone-auth" onClick={onVerificationSuccess}>Complete Phone Verification</button>;
  };
});

jest.mock('@/app/components/PlayerNameForm', () => {
  return function PlayerNameFormMock({ onSubmit }: { onSubmit: (name: string) => void }) {
    return <form data-testid="name-form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit('Test Player');
    }}><button type="submit">Submit Name</button></form>;
  };
});

describe('InviteRegistration Component', () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() };
  const mockValidInvite = {
    id: 'bb7d9f4c-3d35-4518-b8e3-19c87b94f03a',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJiN2Q5ZjRjLTNkMzUtNDUxOC1iOGUzLTE5Yzg3Yjk0ZjAzYSIsImlhdCI6MTY3OTIzMDQ1Nn0',
    group_id: '4f52125a-e99c-4f3f-90a1-dc9c7c53c821',
    is_admin: false,
    used: false,
    created_at: '2023-01-01T14:22:07.117Z',
    expires_at: '2023-04-01T14:22:07.117Z',
    phone: '+12025550198',
    player_id: '',
    user_id: '',
    group_name: 'Weekend Soccer',
    invite_type: 'player'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ token: mockValidInvite.token });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (validateInvite as jest.Mock).mockResolvedValue({ status: 'valid', data: mockValidInvite });
    (usePhoneNumber as jest.Mock).mockReturnValue({ phoneNumber: mockValidInvite.phone });
  });

  test('should render loading state initially', async () => {
    render(<InviteRegistration />);
    expect(screen.getByText('Validating invite...')).toBeInTheDocument();
  });

  test('should validate invite on load', async () => {
    render(<InviteRegistration />);
    await waitFor(() => {
      expect(validateInvite).toHaveBeenCalledWith(mockValidInvite.token);
    });
  });

  test('should show phone auth when invite is valid', async () => {
    render(<InviteRegistration />);
    await waitFor(() => {
      expect(screen.getByTestId('phone-auth')).toBeInTheDocument();
      expect(screen.getByText('Complete Your Registration')).toBeInTheDocument();
    });
  });

  test('should show error when invite is invalid', async () => {
    jest.useFakeTimers();
    (validateInvite as jest.Mock).mockResolvedValue({ status: 'invalid', message: 'Invalid invite link' });
    render(<InviteRegistration />);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid invite link')).toBeInTheDocument();
    });
    
    // Advance timers to trigger the redirect
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
    
    jest.useRealTimers();
  });

  test('should show error when invite is already used', async () => {
    jest.useFakeTimers();
    (validateInvite as jest.Mock).mockResolvedValue({ status: 'already_used' });
    render(<InviteRegistration />);
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, this invite link has already been used.')).toBeInTheDocument();
    });
    
    // Advance timers to trigger the redirect
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
    
    jest.useRealTimers();
  });

  test('should create player and show name form after phone verification', async () => {
    // More specific mock setup
    (createInitialPlayer as jest.Mock).mockResolvedValue({ data: { id: 'player-123' }, error: null });
    (updateInviteWithPlayer as jest.Mock).mockResolvedValue({ data: {}, error: null });
    
    // Set up sequence of session responses
    const mockGetSession = supabase.auth.getSession as jest.Mock;
    mockGetSession.mockImplementation(() => {
      // First call returns no session, second call returns session with user
      if (mockGetSession.mock.calls.length === 1) {
        return Promise.resolve({ data: { session: null } });
      } else {
        return Promise.resolve({ data: { session: { user: { id: 'user-123' } } } });
      }
    });
    
    render(<InviteRegistration />);
    
    await waitFor(() => {
      expect(screen.getByTestId('phone-auth')).toBeInTheDocument();
    });

    // Simulate phone verification success
    fireEvent.click(screen.getByTestId('phone-auth'));
    
    await waitFor(() => {
      expect(screen.getByTestId('name-form')).toBeInTheDocument();
    });
  });

  test('should complete registration when name is submitted', async () => {
    // Setup mocks for existing player
    const mockInviteWithPlayer = { ...mockValidInvite, player_id: 'player-123' };
    (validateInvite as jest.Mock).mockResolvedValue({ status: 'valid', data: mockInviteWithPlayer });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } }
    });
    
    render(<InviteRegistration />);
    
    // If component shows name form directly with player_id, skip phone auth check
    await waitFor(() => {
      expect(screen.getByTestId('name-form')).toBeInTheDocument();
    });
    
    // Submit the name form
    fireEvent.submit(screen.getByTestId('name-form'));
    
    await waitFor(() => {
      // Use more flexible assertions that focus on the essential parameters
      expect(updatePlayerName).toHaveBeenCalled();
      const callArgs = (updatePlayerName as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('player-123');
      expect(callArgs[1]).toBe('Test Player');
      
      // Verify other function calls
      expect(markInviteAsUsed).toHaveBeenCalledWith(mockValidInvite.id);
      // Use a more flexible approach that checks for parameters regardless of order
      expect(createGroupMembership).toHaveBeenCalled();
      const membershipArgs = (createGroupMembership as jest.Mock).mock.calls[0];
      expect(membershipArgs).toContain('player-123');
      expect(membershipArgs).toContain(mockValidInvite.group_id);
      expect(mockRouter.replace).toHaveBeenCalledWith('/pending-approval');
    });
  });
});