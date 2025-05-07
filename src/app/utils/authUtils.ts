import { set } from "lodash";
import { supabase } from "./supabaseClient";
import { useGroupName } from "../hooks/useGroupName";
import { GroupContextData } from "../types/group";
import { getUserPlayerId } from "./playerDb";
import { useGroup } from "../context/GroupContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getPlayerByPhone } from "../db/playerQueries";

// Constants
export const MEMBERSHIP_CACHE_KEY = 'playerRatingsMembershipCache';
export const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
export const AUTH_REDIRECT_KEY = 'auth_redirect_state';
export const REDIRECT_EXPIRY = 5 * 60 * 1000; // 5 minutes
// Cache expiration in milliseconds (e.g., 5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

const LAST_ACTIVE_GROUP_KEY = 'lastActiveGroup';
const GAME_CONTEXT_KEY = 'gameContext';

interface MembershipCache {
  isMember: boolean;
  timestamp: number;
  playerId: string;
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
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};
export const getGroupId = (): string | null => {
  const groupId = safeLocalStorage.getItem('pendingGroupId');
  if (!groupId) return null;
  // Remove any extra quotes that might be present
  return groupId.replace(/^["'](.*)["']$/, '$1');
};

export const getStoredPlayerId = (): string | null => {
  const playerId = safeLocalStorage.getItem('storedPlayerId');
  if (!playerId) return null;
  // Remove any extra quotes that might be present
  return playerId.replace(/['"]/g, '');
};
// Add this helper function to safely store the group ID
export const setGroupId = (groupId: string): void => {
  if (!groupId) return;
  // Remove any existing quotes and store the clean ID
  const cleanGroupId = groupId.replace(/^["'](.*)["']$/, '$1');
  safeLocalStorage.setItem('pendingGroupId', cleanGroupId);
};

export function getMembershipFromCache(userId: string | undefined) {
  if (!userId || typeof window === 'undefined') return null;
  
  try {
    const cachedData = localStorage.getItem(MEMBERSHIP_CACHE_KEY);
    if (!cachedData) return null;
    
    const { userId: cachedUserId, isMember, timestamp } = JSON.parse(cachedData);
    
    if (cachedUserId === userId && (Date.now() - timestamp) < CACHE_TTL) {
      return { isMember, isFromCache: true };
    }
  } catch (e) {
    console.error('Error reading membership cache:', e);
  }
  return null;
}

/**
 * Helper to write membership status to cache
 */
export function cacheMembershipStatus(userId: string, isMember: boolean) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({
      userId,
      isMember,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error writing to membership cache:', e);
  }
}

// Set membership status in cache
export function setMembershipCache(userId: string, membershipData: MembershipCache): void {
  try {
    console.log("🍪 setMembershipCache()", userId, membershipData);
    safeLocalStorage.setItem(`membership_${userId}`, JSON.stringify(membershipData));
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
    
    router.push(state.redirectUrl);
  } catch (error) {
    console.error('Error handling redirect:', error);
    router.push('/');
  }
}

export function setLastActiveGroup(groupId: string): void {
  safeLocalStorage.setItem(LAST_ACTIVE_GROUP_KEY, JSON.stringify({ 
    groupId, 
    timestamp: Date.now() 
  }));
}

export function saveAuthContext(gameId?: string): void {
  const context = { gameId, timestamp: Date.now() };
  safeLocalStorage.setItem(GAME_CONTEXT_KEY, JSON.stringify(context));
}

interface LastActiveGroup {
  groupId: string;
  timestamp: number;
}
interface SupabaseGroupRow {
  group_id: string;
  groups: { id: string; name: string } | { id: string; name: string }[];
}

function parseSupabaseGroupRow(
  row: SupabaseGroupRow
): { id: string; name: string } | null {
  if (!row.groups) return null;
  return Array.isArray(row.groups)
    ? row.groups[0] ?? null
    : row.groups;
}


export async function resolveGroupContext(
  phoneNumber: string,
  setCurrentGroup: (group: GroupContextData) => void
): Promise<string> {
  console.log('🔍 Starting group context resolution for phone:', phoneNumber);
  
  // First try pending group
  const pendingGroupId = getGroupId();
  if (pendingGroupId) {
  const { data: groupData } = await supabase
    .from('groups')
    .select('name')
    .eq('id', pendingGroupId)
    .single();
  const groupName = groupData?.name ?? '';
  if (pendingGroupId) {
    console.log('✅ Using pending group:', pendingGroupId);
    setCurrentGroup({ 
      id: pendingGroupId, 
      name: groupName,
      isAdmin: false, 
      isMember: true, 
      memberStatus: 'approved'
    });
    return pendingGroupId;
  }
}

  // Then try last active group
  const lastActiveStr = safeLocalStorage.getItem(LAST_ACTIVE_GROUP_KEY);
  console.log('📍 Last active group check:', lastActiveStr);
  if (lastActiveStr) {
    try {
      const lastActive = JSON.parse(lastActiveStr) as LastActiveGroup;
      console.log('📍 Parsed last active group:', lastActive);
      // Check if the last active group is still recent (within CACHE_EXPIRATION)
      if (Date.now() - lastActive.timestamp < CACHE_EXPIRATION) {
        console.log('✅ Using last active group:', lastActive.groupId);
        return lastActive.groupId;
      }
    } catch (error) {
      console.error('Error parsing last active group:', error);
    }
  }

  // Fall back to fetching groups
  try {
    console.log('📍 Attempting to get player ID for phone:', phoneNumber);
    const sanitizedPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
    const { data: player, error: lookupErr } = await getPlayerByPhone(sanitizedPhone);
    console.log('📍 Player lookup result:', { player, lookupErr });

    if (lookupErr) {
      console.error('❌ Error looking up player:', lookupErr);
      throw lookupErr;
    }

    if (!player?.id) {
      throw new Error('No player ID found');
    }

    // Use the correctly retrieved player ID
    const playerId = player.id;
    console.log('📍 Got player ID:', playerId);

    // Fetch admin groups
    const adminQuery = await supabase
      .from("group_admins")
      .select(`
        group_id,
        groups (
          id,
          name
        )
      `)
      .eq("player_id", playerId);
      console.log('📍 Admin query result:', adminQuery);
    // Fetch member groups
    const memberQuery = await supabase
      .from("group_memberships")
      .select(`
        group_id,
        groups (
          id,
          name
        )
      `)
      .eq("player_id", playerId);
      console.log('📍 Member query result:', memberQuery);

      if (adminQuery.error) console.error('Admin query error:', adminQuery.error);
      if (memberQuery.error) console.error('Member query error:', memberQuery.error);
    if (adminQuery.error || memberQuery.error) {
      throw new Error("Error fetching groups");
    }

     // Try admin groups first
  const adminRows = adminQuery.data as SupabaseGroupRow[];
  console.log('📍 Admin rows:', adminRows);
  if (adminRows.length > 0) {
    const first = parseSupabaseGroupRow(adminRows[0]);
    if (first) {
      console.log('✅ Using first admin group:', first.id);
      setCurrentGroup({
        id: first.id,
        name: first.name,
        isAdmin: true,
        isMember: true,
        memberStatus: 'approved'
      });
      return first.id;
    }
  }

  // Fall back to member groups
  const memberRows = memberQuery.data as SupabaseGroupRow[];
  if (memberRows.length > 0) {
    const first = parseSupabaseGroupRow(memberRows[0]);
    if (first) {
      console.log('✅ Using first member group:', first.id);
      setCurrentGroup({
        id: first.id,
        name: first.name,
        isAdmin: false,
        isMember: true,
        memberStatus: 'approved'
      });
      return first.id;
    }
  }
    // If no groups found, return null
    console.log('⚠️ No groups found for user');
    setCurrentGroup({
      id: '',
      name: '',
      isAdmin: false,
      isMember: false,
      memberStatus: 'pending'
    });
    return '';

  } catch (error) {
    console.error('Error resolving group context:', error);
    setCurrentGroup({
      id: '',
      name: '',
      isAdmin: false,
      isMember: false,
      memberStatus: 'pending'
    });
    return '';
  }
}