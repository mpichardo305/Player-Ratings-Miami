'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group } from '../components/GroupSelector';

type GroupContextType = {
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
};

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedGroupId') || '';
    }
    return '';
  });
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem('selectedGroupId', selectedGroupId);
    }
  }, [selectedGroupId]);

  const updateSelectedGroup = (id: string) => {
    setSelectedGroupId(id);
  };

  return (
    <GroupContext.Provider value={{
      selectedGroupId,
      setSelectedGroupId: updateSelectedGroup,
      currentGroup,
      setCurrentGroup
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
