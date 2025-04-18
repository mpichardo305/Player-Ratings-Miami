"use client";

import { useGroup } from '../context/GroupContext';

export function useGroupAdmin(playerId: string, groupId: string): { isAdmin: boolean, loading: boolean } {
  const { currentGroup, selectedGroupId } = useGroup();
  
  // Return false if the requested group is not the current group
  if (groupId !== selectedGroupId) {
    return { isAdmin: false, loading: false };
  }

  return {
    isAdmin: Boolean(currentGroup?.isAdmin),
    loading: !currentGroup
  };
}