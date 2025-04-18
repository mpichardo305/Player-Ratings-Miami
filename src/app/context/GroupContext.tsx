'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group } from '../components/GroupSelector';

interface GroupContextType {
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  isCurrentGroupAdmin: boolean;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return localStorage.getItem('selectedGroupId') || null;
  });
  const [currentGroup, setCurrentGroup] = useState<Group | null>(() => {
    const saved = localStorage.getItem('currentGroup');
    return saved ? JSON.parse(saved) : null;
  });
  const [isClient, setIsClient] = useState(false);

  const isCurrentGroupAdmin = currentGroup?.isAdmin || false;

  // Safe initialization after mount
  useEffect(() => {
    setIsClient(true);
    const savedGroup = localStorage.getItem('currentGroup');
    if (savedGroup) {
      setCurrentGroup(JSON.parse(savedGroup));
    }
  }, []);

  // Safe storage updates
  useEffect(() => {
    if (isClient && currentGroup) {
      localStorage.setItem('currentGroup', JSON.stringify(currentGroup));
    }
  }, [currentGroup, isClient]);

  // Only render content after client-side hydration
  if (!isClient) {
    return null; // or a loading placeholder
  }

  return (
    <GroupContext.Provider value={{ 
      currentGroup,
      selectedGroupId: selectedGroupId,
      setSelectedGroupId,
      setCurrentGroup,
      isCurrentGroupAdmin
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
