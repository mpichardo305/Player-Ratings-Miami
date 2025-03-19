import {
  updateGroupMembership,
  updateInvitesTableViaPlayerId,
  updatePlayerStatusAndPhone,
  approvePlayer
} from '../approvePlayerQueries';

// Mock functions for Supabase operations
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

// Mock the Supabase client
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom.mockImplementation(() => ({
      select: mockSelect.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      limit: mockLimit.mockReturnThis(),
      single: mockSingle
    }))
  }))
}));

// Import after mocking
import { createClient } from '@/app/utils/supabase/server';

describe('approvePlayerQueries tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs from the tested functions
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('updateGroupMembership', () => {
    const mockPlayerId = 'player-123';
    const mockGroupId = 'group-123';
    const mockPlayerName = 'Test Player';
    const mockPlayerResponse = {
      data: { name: mockPlayerName },
      error: null
    };
    const mockUpdateResponse = {
      data: null,
      error: null
    };

    it('should update group membership status to approved', async () => {
      // Mock the player data fetch
      mockSingle.mockResolvedValueOnce(mockPlayerResponse);
      // Mock the group membership update
      mockEq.mockResolvedValueOnce(mockUpdateResponse);

      const result = await updateGroupMembership(mockPlayerId, mockGroupId);

      expect(result).toEqual(mockUpdateResponse);
      
      // Verify first query to get player name
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'players');
      expect(mockSelect).toHaveBeenCalledWith('name');
      expect(mockEq).toHaveBeenNthCalledWith(1, 'id', mockPlayerId);
      
      // Verify second query to update group membership
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'group_memberships');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'approved',
        name: mockPlayerName
      });
      expect(mockEq).toHaveBeenNthCalledWith(2, 'player_id', mockPlayerId);
      expect(mockEq).toHaveBeenNthCalledWith(3, 'group_id', mockGroupId);
      expect(mockEq).toHaveBeenNthCalledWith(4, 'status', 'pending');
    });

    it('should throw an error if player fetch fails', async () => {
      const errorMessage = 'Player not found';
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      await expect(updateGroupMembership(mockPlayerId, mockGroupId))
        .rejects.toThrow(`Failed to fetch player name: ${errorMessage}`);
    });

    it('should propagate errors from group membership update', async () => {
      // Mock successful player fetch
      mockSingle.mockResolvedValueOnce(mockPlayerResponse);
      // Mock failed update
      const errorMessage = 'Update failed';
      mockEq.mockRejectedValueOnce(new Error(errorMessage));

      await expect(updateGroupMembership(mockPlayerId, mockGroupId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updateInvitesTableViaPlayerId', () => {
    const mockPlayerId = 'player-123';
    const mockResponse = {
      data: null,
      error: null
    };

    it('should update invites to mark as used', async () => {
      mockLimit.mockResolvedValueOnce(mockResponse);

      const result = await updateInvitesTableViaPlayerId(mockPlayerId);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('invites');
      expect(mockUpdate).toHaveBeenCalledWith({ used: true });
      expect(mockEq).toHaveBeenNthCalledWith(1, 'player_id', mockPlayerId);
      expect(mockEq).toHaveBeenNthCalledWith(2, 'used', false);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should handle errors when updating invites', async () => {
      const errorMessage = 'Failed to update invites';
      mockLimit.mockRejectedValueOnce(new Error(errorMessage));

      await expect(updateInvitesTableViaPlayerId(mockPlayerId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updatePlayerStatusAndPhone', () => {
    const mockPlayerId = 'player-123';
    const mockPhoneNumber = '+1234567890';
    const mockNormalizedPhoneNumber = '1234567890';
    const mockPlayerBefore = {
      data: { id: mockPlayerId, status: 'pending', phone: null },
      error: null
    };
    const mockPlayerAfter = {
      data: { id: mockPlayerId, status: 'active', phone: mockNormalizedPhoneNumber },
      error: null
    };
    const mockUpdateResponse = {
      data: null,
      error: null
    };

    it('should update player status and phone when phone is provided', async () => {
      // Mock player queries
      mockSingle
        .mockResolvedValueOnce(mockPlayerBefore) // First call for before update
        .mockResolvedValueOnce(mockPlayerAfter); // Second call for after update
      mockEq.mockResolvedValueOnce(mockUpdateResponse); // Update call

      const result = await updatePlayerStatusAndPhone(mockPlayerId, mockPhoneNumber);

      expect(result).toEqual(mockUpdateResponse);
      expect(mockFrom).toHaveBeenCalledWith('players');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'active',
        phone: mockNormalizedPhoneNumber
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockPlayerId);
    });

    it('should only update player status when phone is not provided', async () => {
      // Mock player queries
      mockSingle
        .mockResolvedValueOnce(mockPlayerBefore) // First call for before update
        .mockResolvedValueOnce({ ...mockPlayerAfter, data: { ...mockPlayerAfter.data, phone: null } }); // Second call for after update
      mockEq.mockResolvedValueOnce(mockUpdateResponse); // Update call

      const result = await updatePlayerStatusAndPhone(mockPlayerId, '');

      expect(result).toEqual(mockUpdateResponse);
      expect(mockFrom).toHaveBeenCalledWith('players');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'active'
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockPlayerId);
    });

    it('should handle errors when updating player', async () => {
      const errorMessage = 'Failed to update player';
      mockSingle.mockResolvedValueOnce(mockPlayerBefore); // First call for before update
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      await expect(updatePlayerStatusAndPhone(mockPlayerId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update player: ${errorMessage}`);
    });
  });

  describe('approvePlayer', () => {
    const mockPlayerId = 'player-123';
    const mockGroupId = 'group-123';
    const mockPhoneNumber = '+1234567890';
    const mockNormalizedPhoneNumber = '1234567890';
    const mockPlayerName = 'Test Player';
    
    const mockPlayerResponse = {
      data: { name: mockPlayerName },
      error: null
    };
    
    const mockPlayerUpdateResponse = {
      data: null,
      error: null
    };
    
    const mockMembershipUpdateResponse = {
      data: null,
      error: null
    };
    
    const mockInviteUpdateResponse = {
      data: null,
      error: null
    };
    
    const mockPlayerBefore = {
      data: { id: mockPlayerId, status: 'pending', phone: null, name: mockPlayerName },
      error: null
    };
    
    const mockPlayerAfter = {
      data: { id: mockPlayerId, status: 'active', phone: mockNormalizedPhoneNumber, name: mockPlayerName },
      error: null
    };

    beforeEach(() => {
      // Reset and setup the mocks for each test
      mockSingle.mockReset();
      mockEq.mockReset();
      mockFrom.mockClear();
      mockUpdate.mockClear();
      mockOrder.mockClear();
      mockLimit.mockClear();
    });

    it('should approve player and update all related records', async () => {
      // Mock responses for each operation
      mockSingle
        .mockResolvedValueOnce(mockPlayerResponse) // First select player name
        .mockResolvedValueOnce(mockPlayerBefore)   // Get player before update
        .mockResolvedValueOnce(mockPlayerAfter);   // Get player after update
        
      mockEq
        .mockResolvedValueOnce(mockPlayerUpdateResponse)   // Player update
        .mockResolvedValueOnce(mockMembershipUpdateResponse); // Group membership update
        
      mockLimit
        .mockResolvedValueOnce(mockInviteUpdateResponse);  // Invite update

      const result = await approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber);

      expect(result).toEqual({
        playerUpdate: mockPlayerUpdateResponse,
        membershipUpdate: mockMembershipUpdateResponse,
        inviteUpdate: mockInviteUpdateResponse
      });
      
      // Verify player update
      expect(mockUpdate).toHaveBeenNthCalledWith(1, {
        status: 'active',
        phone: mockNormalizedPhoneNumber
      });
      
      // Verify group membership update
      expect(mockUpdate).toHaveBeenNthCalledWith(2, {
        status: 'approved',
        name: mockPlayerName
      });
      
      // Verify invite update
      expect(mockUpdate).toHaveBeenNthCalledWith(3, { used: true });
    });

    it('should handle player fetch error', async () => {
      const errorMessage = 'Player not found';
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to fetch player name: ${errorMessage}`);
    });

    it('should handle player update error', async () => {
      mockSingle.mockResolvedValueOnce(mockPlayerResponse);
      
      const errorMessage = 'Failed to update player';
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update player: ${errorMessage}`);
    });

    it('should handle group membership update error', async () => {
      mockSingle
        .mockResolvedValueOnce(mockPlayerResponse)
        .mockResolvedValueOnce(mockPlayerBefore)
        .mockResolvedValueOnce(mockPlayerAfter);
      
      mockEq
        .mockResolvedValueOnce(mockPlayerUpdateResponse)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Membership update failed' }
        });

      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update group membership: Membership update failed`);
    });
  });
});