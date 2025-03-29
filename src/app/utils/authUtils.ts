// Constants
export const MEMBERSHIP_CACHE_KEY = 'playerRatingsMembershipCache'
export const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds
export const GROUP_ID = '299af152-1d95-4ca2-84ba-43328284c38e';

// Cache expiration in milliseconds (e.g., 5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Add new interfaces and constants
export const AUTH_REDIRECT_KEY = 'auth_redirect_state'
export const REDIRECT_EXPIRY = 5 * 60 * 1000 // 5 minutes

interface MembershipCache {
  isMember: boolean;
  timestamp: number;
  isFromCache?: boolean;
}

interface AuthRedirectState {
  redirectUrl: string;
  timestamp: number;
}

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

// Get membership status from cache
export function getMembershipDataFromCache(userId: string): MembershipCache | null {
  try {
    const cachedData = localStorage.getItem(`membership_${userId}`);
    if (!cachedData) return null;
    
    const membershipData = JSON.parse(cachedData) as MembershipCache;
    if (Date.now() - membershipData.timestamp > CACHE_EXPIRATION) {
      return null;
    }
    
    return membershipData;
  } catch (error) {
    console.error('Error reading membership cache:', error);
    return null;
  }
}

// Set membership status in cache
export function setMembershipCache(userId: string, membershipData: MembershipCache): void {
  try {
    localStorage.setItem(`membership_${userId}`, JSON.stringify(membershipData));
  } catch (error) {
    console.error('Error setting membership cache:', error);
  }
}

// Clear membership cache
export function clearMembershipCache(userId: string): void {
  try {
    localStorage.removeItem(`membership_${userId}`);
    console.log('Membership cache cleared for user:', userId);
  } catch (error) {
    console.error('Error clearing membership cache:', error);
  }
}

// Force refresh membership from server
export function forceRefreshMembership(userId: string): void {
  clearMembershipCache(userId);
}

export function saveRedirectUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const state: AuthRedirectState = {
      redirectUrl: url,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_REDIRECT_KEY, JSON.stringify(state));
    console.log('Saved redirect URL:', url);
  } catch (error) {
    console.error('Error saving redirect URL:', error);
  }
}

export function handleAuthRedirect(router: any): void {
  try {
    const stateStr = localStorage.getItem(AUTH_REDIRECT_KEY);
    localStorage.removeItem(AUTH_REDIRECT_KEY);
    
    if (!stateStr) {
      router.push('/');
      return;
    }
    
    const state: AuthRedirectState = JSON.parse(stateStr);
    if (Date.now() - state.timestamp > REDIRECT_EXPIRY || state.redirectUrl === '/') {
      router.push('/');
      return;
    }
    
    console.log('Redirecting to:', state.redirectUrl);
    router.push(state.redirectUrl);
  } catch (error) {
    console.error('Error handling redirect:', error);
    router.push('/');
  }
}