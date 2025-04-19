'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGroupName } from '../hooks/useGroupName';

interface MembershipData {
  isMember: boolean;
  playerId: string;
  status: string;
}

interface GroupContextType {
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  currentGroup: GroupContextData | null;
  setCurrentGroup: (group: GroupContextData | null) => void;
  isCurrentGroupAdmin: boolean;
  updateGroupMembership: (groupId: string, membershipData: MembershipData) => void;
}

interface GroupContextData {
  id: string;
  name: string;
  isAdmin: boolean;
  isMember?: boolean;
  memberStatus?: string;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return localStorage.getItem('selectedGroupId') || null;
  });
  const [currentGroup, setCurrentGroup] = useState<GroupContextData | null>(() => {
    const saved = localStorage.getItem('currentGroup');
    return saved ? JSON.parse(saved) : null;
  });
  const [isClient, setIsClient] = useState(false);

  // Add useGroupName hook for current group
  const { groupName } = useGroupName(currentGroup?.id ?? '');

  const isCurrentGroupAdmin = currentGroup?.isAdmin ?? false;

  const updateGroupMembership = async (groupId: string, membershipData: MembershipData) => {
    if (currentGroup && currentGroup.id === groupId) {
      setCurrentGroup({
        ...currentGroup,
        name: groupName,
        isMember: membershipData.isMember,
        memberStatus: membershipData.status
      });
    }
  };

  const updateGroupStorage = (group: GroupContextData | null) => {
    if (isClient) {
      if (group) {
        localStorage.setItem('currentGroup', JSON.stringify(group));
        localStorage.setItem('selectedGroupId', group.id);
        localStorage.setItem('lastActiveGroup', JSON.stringify({
          groupId: group.id,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem('currentGroup');
        localStorage.removeItem('selectedGroupId');
        localStorage.removeItem('lastActiveGroup');
      }
    }
  };

  // Safe initialization after mount
  useEffect(() => {
    setIsClient(true);
    const savedGroup = localStorage.getItem('currentGroup');
    if (savedGroup) {
      setCurrentGroup(JSON.parse(savedGroup));
    }
  }, []);

  // Replace the existing useEffect for storage updates
  useEffect(() => {
    if (currentGroup) {
      updateGroupStorage(currentGroup);
    }
  }, [currentGroup, isClient]);

  const setCurrentGroupWithStorage = (group: GroupContextData | null) => {
    setCurrentGroup(group);
    setSelectedGroupId(group?.id ?? null);
    updateGroupStorage(group);
  };

  // Only render content after client-side hydration
  if (!isClient) {
    return null; // or a loading placeholder
  }

  return (
    <GroupContext.Provider value={{ 
      currentGroup: currentGroup ? {
        ...currentGroup,
        name: groupName || currentGroup.id // Use the groupName from hook
      } : null,
      selectedGroupId,
      setSelectedGroupId,
      setCurrentGroup: setCurrentGroupWithStorage, // Use the new function
      isCurrentGroupAdmin,
      updateGroupMembership
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
