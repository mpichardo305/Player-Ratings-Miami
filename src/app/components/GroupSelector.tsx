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

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        // Debug logging for inputs
        // Fetch admin groups with detailed logging
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
        
        console.log('📊 Admin groups raw response:', {
          data: adminQuery.data,
          error: adminQuery.error,
          status: adminQuery.status
        });

        console.log('Raw adminQuery.data:', adminQuery.data);

        // Fetch member groups with detailed logging
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
        
        console.log('📊 Member groups raw response:', {
          data: memberQuery.data,
          error: memberQuery.error,
          status: memberQuery.status
        });

        console.log('Raw memberQuery.data:', memberQuery.data);

        if (adminQuery.error || memberQuery.error) {
          console.error("Error fetching groups:", adminQuery.error || memberQuery.error);
          return;
        }

        // Debug the data transformation
        console.log('🔄 Raw admin data:', adminQuery.data);
        console.log('🔄 Raw member data:', memberQuery.data);

        // Type assertions for the query responses
        const adminData = adminQuery.data as SupabaseGroup[];
        const memberData = memberQuery.data as SupabaseGroup[];

        const adminGroupsList: Group[] = (adminData || [])
          .map(g => {
            const groupObj = parseSupabaseGroup(g);
            return groupObj ? { id: groupObj.id, name: groupObj.name, isAdmin: true } : null;
          })
          .filter((g): g is Group => g !== null); // Filter out any null values

        const memberGroupsList: Group[] = (memberData || [])
          .map(g => {
            const groupObj = parseSupabaseGroup(g);
            return groupObj ? { id: groupObj.id, name: groupObj.name, isAdmin: false } : null;
          })
          .filter((g): g is Group => g !== null);

        console.log('📊 Processed groups:', {
          adminGroups: adminGroupsList,
          memberGroups: memberGroupsList
        });

        const uniqueGroups = mergeGroups(adminGroupsList, memberGroupsList);
        console.log('🎯 Final merged groups:', uniqueGroups);

        setGroups(uniqueGroups);
        
        // ... rest of the group selection logic ...
        if (uniqueGroups.length > 0) {
          // Check if the previously selected group still exists
          const currentSelectedExists = uniqueGroups.some(g => g.id === selectedGroupId);
          if (selectedGroupId && currentSelectedExists) {
            // Keep the current selection if it's still valid
            const currentGroupData = uniqueGroups.find(g => g.id === selectedGroupId);
            if (currentGroupData) onGroupSelect(currentGroupData);
          } else {
            // Otherwise, select the first group in the merged list
            setSelectedGroupId(uniqueGroups[0].id);
            onGroupSelect(uniqueGroups[0]);
          }
        } else {
          // Handle case where no groups are found
          const emptyGroup: Group = { id: '', name: '', isAdmin: false };
          setSelectedGroupId('');
          onGroupSelect(emptyGroup);
        }

      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [playerId, onGroupSelect, setSelectedGroupId, selectedGroupId]); // Added selectedGroupId dependency

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