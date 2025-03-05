import { createTestClient } from '@/app/utils/supabase/test-client'
import { checkPlayerMembership } from '../checkUserQueries'

// Define types for our data
interface Player {
  id: string;
  phone: string;
  name: string;
  status: string;
}

jest.mock('@/app/utils/supabase/server', () => ({
  createClient: () => createTestClient()
}))

describe('Membership Tests', () => {
  // Known valid test data
  const VALID_GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'
  const TEST_PHONE = '+13058129479'

  beforeAll(() => {
    // Verify environment variables are loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Required environment variables are not set')
    }
  })

  it('should verify membership with valid UUID', async () => {
    const supabase = createTestClient()
    
    try {
      // First verify the group exists
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('id', VALID_GROUP_ID)
        .single()
      
      expect(group).toBeDefined()
      console.log('Found group:', group)

      // Then check membership
      const result = await checkPlayerMembership(TEST_PHONE, VALID_GROUP_ID)
      console.log('Membership check result:', result)

      // Verify the result structure
      expect(result).toHaveProperty('isMember')
      expect(result).toHaveProperty('playerId')
      
      // Optional: Query the database directly to verify
      if (result.playerId) {
        const { data: directMembership } = await supabase
          .from('group_memberships')
          .select('*')
          .eq('player_id', result.playerId)
          .eq('group_id', VALID_GROUP_ID)
          .single()
          
        console.log('Direct membership query:', directMembership)
      }
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })
})