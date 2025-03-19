import {
  getInviteByToken,
  createInviteRecord,
  updateInviteWithPlayer,
  markInviteAsUsed,
  createGroupMembership
} from '../inviteQueries';

// Set up mock functions for Supabase operations
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

// Mock the Supabase client
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom.mockImplementation(() => ({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle
    }))
  }))
}));

// Import after mocking
import { createClient } from '@/app/utils/supabase/server';

describe('inviteQueries tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInviteByToken', () => {
    const mockToken = 'test-token-123';
    const mockResponse = {
      data: {
        token: mockToken,
        player_id: 'player-123',
        used: false,
        group_id: 'group-123'
      },
      error: null
    };

    it('should get an invite by token', async () => {
      mockSingle.mockResolvedValueOnce(mockResponse);

      const result = await getInviteByToken(mockToken);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('invites');
      expect(mockSelect).toHaveBeenCalledWith('token, player_id, used, group_id');
      expect(mockEq).toHaveBeenCalledWith('token', mockToken);
    });

    it('should handle errors when getting invite', async () => {
      const errorMessage = 'Invite not found';
      mockSingle.mockRejectedValueOnce(new Error(errorMessage));

      await expect(getInviteByToken(mockToken)).rejects.toThrow(errorMessage);
    });
  });

  describe('createInviteRecord', () => {
    const mockToken = 'new-token-123';
    const mockGroupId = 'group-123';
    const mockPlayerId = 'player-123';
    const mockResponse = {
      data: {
        token: mockToken,
        used: false,
        group_id: mockGroupId,
        player_id: mockPlayerId
      },
      error: null
    };

    it('should create an invite record', async () => {
      mockSingle.mockResolvedValueOnce(mockResponse);

      const result = await createInviteRecord(mockToken, mockGroupId, mockPlayerId);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('invites');
      expect(mockInsert).toHaveBeenCalledWith([{
        token: mockToken,
        used: false,
        group_id: mockGroupId,
        player_id: mockPlayerId
      }]);
    });

    it('should handle errors when creating invite', async () => {
      const errorMessage = 'Failed to create invite';
      mockSingle.mockRejectedValueOnce(new Error(errorMessage));

      await expect(createInviteRecord(mockToken, mockGroupId, mockPlayerId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updateInviteWithPlayer', () => {
    const mockInviteId = 'invite-123';
    const mockPlayerId = 'player-123';
    const mockResponse = {
      data: null,
      error: null
    };

    it('should update an invite with player ID', async () => {
      mockEq.mockResolvedValueOnce(mockResponse);

      const result = await updateInviteWithPlayer(mockInviteId, mockPlayerId);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('invites');
      expect(mockUpdate).toHaveBeenCalledWith({
        player_id: mockPlayerId
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockInviteId);
    });

    it('should handle errors when updating invite', async () => {
      const errorMessage = 'Failed to update invite';
      mockEq.mockRejectedValueOnce(new Error(errorMessage));

      await expect(updateInviteWithPlayer(mockInviteId, mockPlayerId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('markInviteAsUsed', () => {
    const mockInviteId = 'invite-123';
    const mockResponse = {
      data: null,
      error: null
    };

    it('should mark an invite as used', async () => {
      mockEq.mockResolvedValueOnce(mockResponse);

      const result = await markInviteAsUsed(mockInviteId);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('invites');
      expect(mockUpdate).toHaveBeenCalledWith({ used: 'TRUE' });
      expect(mockEq).toHaveBeenCalledWith('id', mockInviteId);
    });

    it('should handle errors when marking invite as used', async () => {
      const errorMessage = 'Failed to update invite';
      mockEq.mockRejectedValueOnce(new Error(errorMessage));

      await expect(markInviteAsUsed(mockInviteId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createGroupMembership', () => {
    const mockPlayerId = 'player-123';
    const mockGroupId = 'group-123';
    const mockResponse = {
      data: {
        player_id: mockPlayerId,
        group_id: mockGroupId,
        status: 'pending'
      },
      error: null
    };

    it('should create a group membership', async () => {
      mockInsert.mockResolvedValueOnce(mockResponse);

      const result = await createGroupMembership(mockPlayerId, mockGroupId);

      expect(result).toEqual(mockResponse);
      expect(mockFrom).toHaveBeenCalledWith('group_memberships');
      expect(mockInsert).toHaveBeenCalledWith({
        player_id: mockPlayerId,
        group_id: mockGroupId,
        status: 'pending'
      });
    });

    it('should handle errors when creating group membership', async () => {
      const errorMessage = 'Failed to create group membership';
      mockInsert.mockRejectedValueOnce(new Error(errorMessage));

      await expect(createGroupMembership(mockPlayerId, mockGroupId))
        .rejects.toThrow(errorMessage);
    });
  });
});