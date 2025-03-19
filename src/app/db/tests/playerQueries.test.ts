import { createInitialPlayer } from '../playerQueries';

// Set up mock functions outside the mock definition
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

// Mock the Supabase client
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert.mockReturnThis(),
      select: mockSelect.mockReturnThis(),
      single: mockSingle
    }))
  }))
}));

// Import after mocking
import { createClient } from '@/app/utils/supabase/server';

describe('playerQueries tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInitialPlayer', () => {
    const mockPlayerId = '123e4567-e89b-12d3-a456-426614174000';
    const mockPhoneNumber = '+13055551234';
    const mockResponse = {
      data: {
        id: mockPlayerId,
        phone: mockPhoneNumber,
        status: 'pending',
        user_id: null
      },
      error: null
    };

    it('should create a player with valid inputs', async () => {
      // Setup mock return value
      mockSingle.mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await createInitialPlayer(mockPlayerId, mockPhoneNumber);

      // Verify the result
      expect(result).toEqual(mockResponse);

      // Verify Supabase was called correctly
      expect(createClient().from).toHaveBeenCalledWith('players');
      expect(mockInsert).toHaveBeenCalledWith({
        status: 'pending',
        phone: mockPhoneNumber,
        user_id: null,
        id: mockPlayerId
      });
    });

    it('should create a player with null phone number', async () => {
      // Setup mock return value
      mockSingle.mockResolvedValueOnce({
        ...mockResponse,
        data: { ...mockResponse.data, phone: null }
      });

      // Call the function
      const result = await createInitialPlayer(mockPlayerId, null);

      // Verify the result matches expected data with null phone
      expect(result.data.phone).toBeNull();

      // Verify Supabase was called with null phone
      expect(mockInsert).toHaveBeenCalledWith({
        status: 'pending',
        phone: null,
        user_id: null,
        id: mockPlayerId
      });
    });

    it('should handle Supabase errors', async () => {
      // Setup mock to throw an error
      const errorMessage = 'Database error';
      mockSingle.mockRejectedValueOnce(new Error(errorMessage));

      // Call the function and expect it to reject
      await expect(createInitialPlayer(mockPlayerId, mockPhoneNumber))
        .rejects.toThrow(errorMessage);
    });
  });
});