"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
export default function AddPlayer() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      // Fetch session first since it's not available in this page
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        console.error("❌ Error fetching session or no access token found:", error);
        return;
      }
  
      console.log("✅ Retrieved session in add-player page:", session);
      console.log("✅ Sending token in API call:", session.access_token);
  
      try {
        const response = await fetch("/api/get-user-groups", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,  // Use fetched token
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          console.error("❌ Error fetching groups:", response.status, response.statusText);
          return;
        }
  
        const data = await response.json();
        console.log("✅ Response from get-user-groups API:", data);
        
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroup(data.groups[0].id);
        }
      } catch (error) {
        console.error("❌ Error making request to get-user-groups API:", error);
      }
    };
  
    fetchGroups(); // Fetch session and then fetch groups
  }, []);

  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setMessage("Player name is required.");
      return;
    }
    if (!selectedGroup) {
      setMessage("Please select a group.");
      return;
    }

    const response = await fetch("/api/add-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, groupId: selectedGroup }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(`✅ Player request submitted for ${name}`);
      setName(""); // Clear input
      // setShowBackButton(true)
    } else {
      setMessage(`❌ Error: ${data.error}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white text-center">Request a New Player</h2>

        <div className="mt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
            className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="mt-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select the group to add player</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddPlayer}
          className="w-full mt-4 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition duration-200"
        >
          Add Player
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-300">{message}</p>
        )}
        {/* {showBackButton && ( */}
          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Back to Home
          </button>
        {/* )} */}
      </div>
    </div>
  );
}