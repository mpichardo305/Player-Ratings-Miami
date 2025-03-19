// Constants
export const MEMBERSHIP_CACHE_KEY = 'playerRatingsMembershipCache'
export const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds
export const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e'

/**
 * Helper to read membership status from cache
 */
export function getMembershipFromCache(userId: string | undefined) {
  if (!userId || typeof window === 'undefined') return null
  
  try {
    const cachedData = localStorage.getItem(MEMBERSHIP_CACHE_KEY)
    if (!cachedData) return null
    
    const { userId: cachedUserId, isMember, timestamp } = JSON.parse(cachedData)
    
    if (cachedUserId === userId && (Date.now() - timestamp) < CACHE_TTL) {
      return { isMember, isFromCache: true }
    }
  } catch (e) {
    console.error('Error reading membership cache:', e)
  }
  return null
}

/**
 * Helper to write membership status to cache
 */
export function cacheMembershipStatus(userId: string, isMember: boolean) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({
      userId,
      isMember,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Error writing to membership cache:', e)
  }
}