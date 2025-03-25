import {
  updateGroupMembership,
  updateInvitesTableViaPlayerId,
  updatePlayerStatusAndPhone,
  approvePlayer
} from '../approvePlayerQueries';

// Mock functions for Supabase operations
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

// Mock the Supabase client
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom
  }))
}));

// Import after mocking
import { createClient } from '@/app/utils/supabase/server';

// Test constants
const mockPlayerId = 'player-123';
const mockGroupId = 'group-123';
const mockPlayerName = 'Test Player';
const mockPhoneNumber = '+1234567890';
const mockNormalizedPhoneNumber = '1234567890';

describe('approvePlayerQueries tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs from the tested functions
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('updateGroupMembership', () => {
    it('should update group membership status to approved', async () => {
      // First call: fetching player name from 'players' table
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { name: mockPlayerName }, error: null })
            })
          })
        };
      });
      // Second call: updating group membership in 'group_memberships'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('group_memberships');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ status: 'approved', name: mockPlayerName });
            return {
              eq: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({ data: { updated: true }, error: null })
                })
              })
            };
          }
        };
      });

      const result = await updateGroupMembership(mockPlayerId, mockGroupId);
      expect(result).toEqual({ data: { updated: true }, error: null });
    });

    it('should throw an error if player fetch fails', async () => {
      const errorMessage = 'Player not found';
      // For player fetch failure:
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: errorMessage } })
            })
          })
        };
      });
      await expect(updateGroupMembership(mockPlayerId, mockGroupId))
        .rejects.toThrow(`Failed to fetch player name: ${errorMessage}`);
    });

    it('should propagate errors from group membership update', async () => {
      const errorMessage = 'Update failed';
      // First call: successful player fetch
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { name: mockPlayerName }, error: null })
            })
          })
        };
      });
      // Second call: simulate error on group membership update
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('group_memberships');
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({ data: null, error: { message: errorMessage } })
              })
            })
          })
        };
      });
      const result = await updateGroupMembership(mockPlayerId, mockGroupId);
      // Instead of expecting a throw, check that the error is present in the result
      expect(result).toEqual({ data: null, error: { message: errorMessage } });
    });
  });

  describe('updateInvitesTableViaPlayerId', () => {
    it('should update invites to mark as used', async () => {
      const mockResponse = { data: { updated: true }, error: null };
      // Setup invites update chain
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('invites');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ used: true });
            return {
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => Promise.resolve(mockResponse)
                  })
                })
              })
            };
          }
        };
      });

      const result = await updateInvitesTableViaPlayerId(mockPlayerId);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when updating invites', async () => {
      const errorMessage = 'Failed to update invites';
      // Setup invites update chain to reject
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('invites');
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.reject(new Error(errorMessage))
                })
              })
            })
          })
        };
      });
      await expect(updateInvitesTableViaPlayerId(mockPlayerId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updatePlayerStatusAndPhone', () => {
    it('should update player status and phone when phone is provided', async () => {
      // First call: get beforePlayer from 'players'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'pending', phone: null },
                  error: null
                })
            })
          })
        };
      });
      // Second call: update player record (should include normalized phone)
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ status: 'active', phone: mockNormalizedPhoneNumber });
            return {
              eq: () =>
                Promise.resolve({ data: { updated: true }, error: null })
            };
          }
        };
      });
      // Third call: fetch updated player record
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'active', phone: mockNormalizedPhoneNumber },
                  error: null
                })
            })
          })
        };
      });

      const result = await updatePlayerStatusAndPhone(mockPlayerId, mockPhoneNumber);
      expect(result).toEqual({ data: { updated: true }, error: null });
    });

    it('should only update player status when phone is not provided', async () => {
      // First call: get beforePlayer
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'pending', phone: null },
                  error: null
                })
            })
          })
        };
      });
      // Second call: update player record (only status update)
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ status: 'active' });
            return {
              eq: () =>
                Promise.resolve({ data: { updated: true }, error: null })
            };
          }
        };
      });
      // Third call: fetch updated player record
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'active', phone: null },
                  error: null
                })
            })
          })
        };
      });

      const result = await updatePlayerStatusAndPhone(mockPlayerId, '');
      expect(result).toEqual({ data: { updated: true }, error: null });
    });

    it('should handle errors when updating player', async () => {
      const errorMessage = 'Update error';
      // First call: get beforePlayer
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'pending', phone: null },
                  error: null
                })
            })
          })
        };
      });
      // Second call: update player returns error
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({ data: null, error: { message: errorMessage } })
          })
        };
      });
      await expect(updatePlayerStatusAndPhone(mockPlayerId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update player: ${errorMessage}`);
    });
  });

  describe('approvePlayer', () => {
    it('should approve player and update all related records', async () => {
      // 1. Fetch player name from 'players'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { name: mockPlayerName }, error: null })
            })
          })
        };
      });
      // 2. Update player record in 'players'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ status: 'active', phone: mockNormalizedPhoneNumber });
            return {
              eq: () =>
                Promise.resolve({ data: { updated: true }, error: null })
            };
          }
        };
      });
      // 3. Fetch beforePlayer (dummy call for debugging)
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { id: mockPlayerId, status: 'pending', phone: null }, error: null })
            })
          })
        };
      });
      // 4. Fetch updated player (dummy call for debugging)
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'active', phone: mockNormalizedPhoneNumber },
                  error: null
                })
            })
          })
        };
      });
      // 5. Update group membership in 'group_memberships'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('group_memberships');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ status: 'approved', name: mockPlayerName });
            return {
              eq: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({ data: { updated: true }, error: null })
                })
              })
            };
          }
        };
      });
      // 6. Update invites in 'invites'
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('invites');
        return {
          update: (payload: any) => {
            expect(payload).toEqual({ used: true });
            return {
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({ data: { updated: true }, error: null })
                  })
                })
              })
            };
          }
        };
      });

      const result = await approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber);
      expect(result).toEqual({
        playerUpdate: { data: { updated: true }, error: null },
        membershipUpdate: { data: { updated: true }, error: null },
        inviteUpdate: { data: { updated: true }, error: null }
      });
    });

    it('should handle player fetch error', async () => {
      const errorMessage = 'Player not found';
      // Simulate error when fetching player name
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: errorMessage } })
            })
          })
        };
      });
      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to fetch player name: ${errorMessage}`);
    });

    it('should handle player update error', async () => {
      const errorMessage = 'Player update error';
      // 1. Fetch player name successfully
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { name: mockPlayerName }, error: null })
            })
          })
        };
      });
      // 2. Player update returns error
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({ data: null, error: { message: errorMessage } })
          })
        };
      });
      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update player: ${errorMessage}`);
    });

    it('should handle group membership update error', async () => {
      const errorMessage = 'Group membership update error';
      // 1. Fetch player name successfully
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { name: mockPlayerName }, error: null })
            })
          })
        };
      });
      // 2. Player update is successful
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          update: () => ({
            eq: () =>
              Promise.resolve({ data: { updated: true }, error: null })
          })
        };
      });
      // 3. Dummy beforePlayer call
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { id: mockPlayerId, status: 'pending', phone: null }, error: null })
            })
          })
        };
      });
      // 4. Dummy updatedPlayer call
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('players');
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: mockPlayerId, status: 'active', phone: mockNormalizedPhoneNumber },
                  error: null
                })
            })
          })
        };
      });
      // 5. Group membership update returns error
      mockFrom.mockImplementationOnce((tableName) => {
        expect(tableName).toBe('group_memberships');
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({ data: null, error: { message: errorMessage } })
              })
            })
          })
        };
      });
      await expect(approvePlayer(mockPlayerId, mockGroupId, mockPhoneNumber))
        .rejects.toThrow(`Failed to update group membership: ${errorMessage}`);
    });
  });
});