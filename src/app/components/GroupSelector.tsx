// /components/GroupSelector.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { useGroup } from '../context/GroupContext';


interface Group {
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
};
export default function GroupSelector({ sessionUserId, onGroupSelect }: GroupSelectorProps) {

  const [groups, setGroups] = useState<Group[]>([]);
  const { selectedGroupId, setSelectedGroupId, setCurrentGroup } = useGroup();
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
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
  ?.filter((ug: UserGroup) => ug.groups)
  .map((ug: UserGroup) => ug.groups)
  .flat() || [];

    setGroups(validGroups);
    if (validGroups.length > 0) {
      setSelectedGroupId(validGroups[0].id);
      onGroupSelect(validGroups[0]);
    }

  } catch (error) {
    console.error("Error fetching groups:", error);
  } finally {
    setIsLoading(false);
  }
};

    fetchGroups();
  }, [sessionUserId, onGroupSelect, setSelectedGroupId]);

  // Check admin status for the selected group
  useEffect(() => {
    if (!sessionUserId || !selectedGroupId) return;
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("group_admins")
        .select("id")
        .eq("player_id", sessionUserId)
        .eq("group_id", selectedGroupId)
        .maybeSingle();
      if (error) {
        console.error("Error checking admin status:", error);
      }
      setIsGroupAdmin(!!data);
    };

    checkAdmin();
  }, [sessionUserId, selectedGroupId]);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value;
    setSelectedGroupId(groupId);
    const group = groups.find(g => g.id === groupId);
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
    <div className="mb-4">
      <select
        value={selectedGroupId}
        onChange={handleGroupChange}
        className="bg-gray-700 text-white p-2 rounded"
      >
        {groups.map(group => (
          <option key={group.id} value={group.id}>{group.name}</option>
        ))}
      </select>
      {isGroupAdmin && selectedGroupId && (
        <div className="mt-2">
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded"
              />
              <button onClick={handleNameEdit} className="bg-green-500 px-4 py-2 rounded">
                Save
              </button>
              <button onClick={handleCancel} className="bg-red-500 px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="bg-blue-500 px-4 py-2 rounded">
              Edit Group Name
            </button>
          )}
        </div>
      )}
    </div>
  );
}