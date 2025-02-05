'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group } from '../components/GroupSelector';

type Group = {
  id: string;
  name: string;
};

type GroupContextType = {
  currentGroup: Group | null;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  setCurrentGroup: (group: Group | null) => void;
};

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isClient, setIsClient] = useState(false);

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
      currentGroup
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
