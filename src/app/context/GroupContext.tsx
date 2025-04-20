'use client';

import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';

const LOCAL_STORAGE_KEY = 'currentGroup';

// Helper function to safely access localStorage
const getFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
    return null;
  }
};

// Helper function to safely write to localStorage
const setToStorage = (value: any) => {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      console.log('Saving to localStorage:', value); // Add this log
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Error writing to localStorage:', error);
  }
};

export interface Group {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface GroupContextData extends Group {
  isMember?: boolean;
  memberStatus?: string;
}

interface GroupContextType {
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  currentGroup: GroupContextData | null;
  setCurrentGroup: (g: GroupContextData | null) => void;
  isCurrentGroupAdmin: boolean;
  updateGroupMembership: (groupId: string, membershipData: any) => void;
}

export const GroupContext = createContext<GroupContextType|undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const stored = getFromStorage();
    return stored ? stored.id : null;
  });

  const [currentGroup, internalSetCurrentGroup] = useState<Group | null>(() => {
    return getFromStorage();
  });

  const updateGroupMembership = useCallback((groupId: string, membershipData: any) => {
    if (currentGroup && currentGroup.id === groupId) {
      const updatedGroup = {
        ...currentGroup,
        ...membershipData
      };
      internalSetCurrentGroup(updatedGroup);
      setToStorage(updatedGroup);
    }
  }, [currentGroup]);

  const value = useMemo(() => ({
    selectedGroupId,
    setSelectedGroupId,
    currentGroup,
    setCurrentGroup: (group: Group | null) => {
      console.log('🟡 setCurrentGroup called with:', group);
      internalSetCurrentGroup(group);
      setToStorage(group);
    },
    isCurrentGroupAdmin: currentGroup?.isAdmin ?? false,
    updateGroupMembership
  }), [selectedGroupId, currentGroup, updateGroupMembership]);

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext (GroupContext) ;
  if (context == undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
