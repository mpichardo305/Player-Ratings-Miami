import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { useGroup } from '../context/GroupContext';
import { useGroupAdmin } from '../hooks/useGroupAdmin';
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Keep your branch's Group interface with isAdmin
export interface Group {
  id: string;
  name: string;
  isAdmin: boolean; // From your branch
}

interface UserGroup {
  group_id: string;
  groups: Group;
}

// Define the SupabaseGroup interface so that groups can be either an array or a single object.
interface SupabaseGroup {
  group_id: string;
  groups: { id: string; name: string } | { id: string; name: string }[];
}

// A helper to normalize the group data: if groups is an array, return the first element; otherwise, return it directly.
function parseSupabaseGroup(g: SupabaseGroup): { id: string; name: string } | null {
  if (!g.groups) return null;
  if (Array.isArray(g.groups)) {
    return g.groups.length > 0 ? g.groups[0] : null;
  } else {
    return g.groups;
  }
}

type GroupSelectorProps = {
  playerId: string; // Revert to main's naming
  onGroupSelect: (group: Group) => void;
  hideEditIcon?: boolean;
};

// Keep your branch's mergeGroups function
const mergeGroups = (adminGroups: Group[], memberGroups: Group[]): Group[] => {
  console.log('Starting merge with:', {
    adminGroupsCount: adminGroups.length,
    memberGroupsCount: memberGroups.length,
    adminGroups,
    memberGroups
  });

  const groupMap = new Map<string, Group>();
  
  memberGroups.forEach(group => {
    console.log('Adding member group:', group);
    groupMap.set(group.id, group);
  });
  
  adminGroups.forEach(group => {
    console.log('Adding/updating admin group:', group);
    groupMap.set(group.id, {
      ...group,
      isAdmin: true
    });
  });

  const result = Array.from(groupMap.values());
  console.log('Merge result:', result);
  
  return result;
};

export default function GroupSelector({ playerId, onGroupSelect, hideEditIcon = false }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const { selectedGroupId, setSelectedGroupId, setCurrentGroup } = useGroup();
  
  // Update useGroupAdmin to use playerId
  const { isAdmin: isGroupAdmin, loading: isAdminLoading } = useGroupAdmin(
    playerId ?? '', // Use playerId as in main
    selectedGroupId ?? ''
  );

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1) get the Supabase user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
  
      // 2) find all playerIds for that user
      const { data: players, error: pErr } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
      if (pErr) throw pErr
  
      const playerIds = players?.map(p => p.id) ?? []
      if (playerIds.length === 0) {
        setGroups([])
        return
      }
  
      // 3) fetch _all_ admin memberships for ANY of those playerIds
      const { data: adminRaw, error: aErr } = await supabase
        .from('group_admins')
        .select('group_id, groups(id,name)')
        .in('player_id', playerIds)
      if (aErr) throw aErr
  
      // 4) fetch _all_ member memberships for ANY of those playerIds
      const { data: memberRaw, error: mErr } = await supabase
        .from('group_memberships')
        .select('group_id, groups(id,name)')
        .in('player_id', playerIds)
      if (mErr) throw mErr
  
      // 5) normalize & merge as before
      const adminGroupsList = (adminRaw as SupabaseGroup[])
        .flatMap(g => Array.isArray(g.groups) ? g.groups : [g.groups])
        .filter((x): x is {id:string;name:string} => !!x)
        .map(g => ({ ...g, isAdmin: true }))
  
      const memberGroupsList = (memberRaw as SupabaseGroup[])
        .flatMap(g => Array.isArray(g.groups) ? g.groups : [g.groups])
        .filter((x): x is {id:string;name:string} => !!x)
        .map(g => ({ ...g, isAdmin: false }))
  
      const unique = mergeGroups(adminGroupsList, memberGroupsList)
      setGroups(unique)
  
      // …rest of your select/default logic…
      if (unique.length > 0) {
        const currentSelectedExists = unique.some(g => g.id === selectedGroupId);
        if (selectedGroupId && currentSelectedExists) {
          const currentGroupData = unique.find(g => g.id === selectedGroupId)!;
          setSelectedGroupId(currentGroupData.id);
          setCurrentGroup(currentGroupData);     
          onGroupSelect(currentGroupData);
        } else {
          setSelectedGroupId(unique[0].id);
          setCurrentGroup(unique[0]);      
          onGroupSelect(unique[0]);
        }
      } else {
        const emptyGroup: Group = { id: '', name: '', isAdmin: false };
        setSelectedGroupId('');
        setCurrentGroup(emptyGroup);             
        onGroupSelect(emptyGroup);
      }
    }
    catch(e) { console.error(e) }
    finally { setIsLoading(false) }
  }, []);
  
  const handleGroupChange = useCallback((value: string) => {
    console.log('🟣 GroupSelector value selected:', value);
    setSelectedGroupId(value);
    const group = groups.find(g => g.id === value);
    console.log('🟤 GroupSelector found group:', group);
    if (group) {
      onGroupSelect(group);
      setCurrentGroup(group);
    }
  }, [groups, onGroupSelect, setCurrentGroup, setSelectedGroupId]);

const handleNameEdit = useCallback(async () => {
  if (!selectedGroupId || !newName) return;
  const { error } = await supabase
    .from("groups")
    .update({ name: newName })
    .eq("id", selectedGroupId);
  if (error) {
    console.error("Error updating group name:", error);
  } else {
    setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, name: newName } : g));
    setEditing(false);
  }
}, [selectedGroupId, newName, groups]);
    
  const handleCancel = async () => {
    setEditing(false);
  };
  useEffect(() => {
    let isMounted = true;
    if (!playerId) {
      return; // Don't fetch if we don't have a playerId yet
    }
    const loadGroups = async () => {
      await fetchGroups();
      if (!isMounted) return;
    };
    loadGroups();
    window.addEventListener('membershipApproved', fetchGroups);
    return () => {
      window.removeEventListener('membershipApproved', fetchGroups);
      isMounted = false;
    }
  }, [fetchGroups, playerId]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedGroupId || ''} onValueChange={handleGroupChange}>
          <SelectTrigger className="w-[200px] bg-secondary border-input">
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent className="bg-card border-input">
            {groups.map(group => (
              <SelectItem 
                key={group.id} 
                value={group.id}
                className="focus:bg-primary focus:text-primary-foreground"
              >
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!hideEditIcon && isGroupAdmin && selectedGroupId && !editing && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(true);
                    setNewName(groups.find(g => g.id === selectedGroupId)?.name || "");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Group Name</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {!hideEditIcon && isGroupAdmin && selectedGroupId && editing && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-secondary border-input"
            autoFocus
          />
          <Button
            onClick={handleNameEdit}
            variant="default"
            className="bg-primary text-primary-foreground"
          >
            Save
          </Button>
          <Button
            onClick={handleCancel}
            variant="destructive"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}