import { useState, useEffect } from "react";
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

export interface Group {
  id: string;
  name: string;
};

interface UserGroup {
  group_id: string;
  groups: Group;
}

type GroupSelectorProps = {
  sessionUserId: string;
  onGroupSelect: (group: Group) => void;
  hideEditIcon?: boolean; // New optional prop
};

export default function GroupSelector({ sessionUserId, onGroupSelect, hideEditIcon = false }: GroupSelectorProps) {

  const [groups, setGroups] = useState<Group[]>([]);
  const { selectedGroupId, setSelectedGroupId, setCurrentGroup } = useGroup();
  const { isAdmin: isGroupAdmin, loading: isAdminLoading } = useGroupAdmin(sessionUserId ?? '', selectedGroupId ?? '');
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  

  // Fetch groups where the user is an admin
  // hardcoding the admin player id for now but should be sessionUserId
  useEffect(() => {
    const fetchGroups = async () => {
      console.log("sessionUserId",sessionUserId)
      setIsLoading(true);
      try {
      const { data: userGroups, error } = await supabase
        .from("group_admins")
        .select(`
          group_id,
          groups (
            id,
            name
          )
        `)
        .eq("player_id", "3e0a04fb-6e4b-41ee-899f-a7f1190b57f5");
      
      if (error) {
        console.error("Error fetching groups:", error.message);
        return;
      }

      const validGroups = userGroups
      ?.filter(ug => ug.groups)
      .map(ug => ug.groups)
      .flat() || [];

    setGroups(validGroups);
    if (validGroups.length > 0) {
      setSelectedGroupId(validGroups[0].id);
      onGroupSelect(validGroups[0]);
    } else {
      const emptyGroup: Group = {
        id: '',
        name: ''
      };
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
  }, [sessionUserId, onGroupSelect, setSelectedGroupId]);

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    const group = groups.find(g => g.id === value);
    if (group) {
      onGroupSelect(group);
      setCurrentGroup(group);
    }
  };

  const handleNameEdit = async () => {
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
  };
    
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