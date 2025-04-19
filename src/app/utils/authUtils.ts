import { set } from "lodash";
import { supabase } from "./supabaseClient";
import { useGroupName } from "../hooks/useGroupName";
import { GroupContextData } from "../types/group";
import { getUserPlayerId } from "./playerDb";

// Constants
export const MEMBERSHIP_CACHE_KEY = 'playerRatingsMembershipCache'
export const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds

// Cache expiration in milliseconds (e.g., 5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Add new interfaces and constants
export const AUTH_REDIRECT_KEY = 'auth_redirect_state'
export const REDIRECT_EXPIRY = 5 * 60 * 1000 // 5 minutes

const LAST_ACTIVE_GROUP_KEY = 'lastActiveGroup';
const GAME_CONTEXT_KEY = 'gameContext';

export let GROUP_ID: string | null = null;

interface MembershipCache {
  isMember: boolean;
  timestamp: number;
  isFromCache?: boolean;
}

interface AuthRedirectState {
  redirectUrl: string;
  timestamp: number;
}
interface GroupMember {
  group_id: string;
  groups: {
    id: string;
    name: string;
  }[];
  is_admin: boolean;
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

export async function resolveGroupContext(
  phoneNumber: string, 
  setCurrentGroup: (group: GroupContextData | null) => void
): Promise<string | null> {
  console.log('🔍 Starting group context resolution for phone:', phoneNumber);

  // 1. Check game context
  console.log('📱 Checking game context...');
  const gameContext = localStorage.getItem(GAME_CONTEXT_KEY);
  if (gameContext) {
    console.log('Found game context:', gameContext);
    const { gameId } = JSON.parse(gameContext);
    const groupId = await getGroupIdFromGame(gameId);
    if (groupId) {
      console.log('✅ Resolved group ID from game:', groupId);
      setCurrentGroup({
        id: groupId,
        name: groupId, // Will be updated by useGroupName hook
        isAdmin: false, // Will be updated when membership is checked
        isMember: false,
        memberStatus: 'pending'
      });
      return groupId;
    }
    console.log('❌ No group ID found for game:', gameId);
  } else {
    console.log('❌ No game context found in localStorage');
  }

  // 2. Check user's primary group
  console.log('👥 Checking user groups...');
  const groups = await getUserGroups(phoneNumber);
  if (groups.length > 0) {
    console.log('✅ Found user groups:', groups);
    setCurrentGroup({
      id: groups[0].id,
      name: groups[0].name,
      isAdmin: groups[0].isAdmin,
      isMember: true,
      memberStatus: 'approved'
    });
    return groups[0].id;
  }
  console.log('❌ No groups found for user');

  // 3. Clear group if no valid group found
  console.log('❌ No valid group context found, clearing current group');
  setCurrentGroup(null);
  return null;
}

export function setLastActiveGroup(groupId: string): void {
  localStorage.setItem(LAST_ACTIVE_GROUP_KEY, JSON.stringify({ groupId, timestamp: Date.now() }));
}

export function saveAuthContext(gameId?: string): void {
  const context = { gameId, timestamp: Date.now() };
  localStorage.setItem(GAME_CONTEXT_KEY, JSON.stringify(context));
}

async function getGroupIdFromGame(gameId: string): Promise<string | null> {
  console.log('🎮 Getting group ID for game:', gameId);
  const { data, error } = await supabase.from('games').select('group_id').eq('id', gameId).single();
  return error ? null : data?.group_id || null;
}
async function getUserGroups(phoneNumber: string): Promise<{ id: string; name: string; isAdmin: boolean }[]> {
  console.log('👥 Getting user groups for phone:', phoneNumber);
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log('❌ No user session found');
      return [];
    }

    // Get playerId using session user ID
    const playerId = await getUserPlayerId(session.user.id);
    if (!playerId) {
      console.log('❌ No player ID found for user:', session.user.id);
      return [];
    }

    console.log('✅ Found player ID:', playerId);

    // Use existing query structure
    const { data, error } = await supabase
      .from('group_memberships')
      .select('group_id')
      .eq('player_id', playerId);

    if (error) {
      console.log('❌ Error getting user groups:', error.message);
      return [];
    }

    console.log('📊 Raw group data:', data);
    return data.map(item => ({
      id: item.group_id,
      name: item.group_id, // Using ID as name temporarily
      isAdmin: false // Default to false, can be updated later
    }));
  } catch (error) {
    console.error('❌ Error in getUserGroups:', error);
    return [];
  }
}