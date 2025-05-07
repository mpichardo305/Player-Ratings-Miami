"use client";
// This components allows non-admins to request new players to join the group but was never fully developed.
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { GroupContext } from "@/app/context/GroupContext"; 
import PhoneInput from "react-phone-number-input/input";
import 'react-phone-number-input/style.css'

export default function AddPlayer() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState("");
  const groupContext = useContext(GroupContext);
  if (!groupContext) {
    throw new Error('Group context is undefined');
  }
  
  const { selectedGroupId } = groupContext;
console.log(selectedGroupId);
  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setMessage("Player name is required.");
      return;
    }
// consider adding groupId as something that comes in...make it similar to approve-player api
    try {
      const response = await fetch("/api/add-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, groupId: selectedGroupId, phone }),
      });
      
      if (response.ok) {
        setMessage(`${name}`+ " has been requested to join the group.");
        setName("");
        setPhone("");
      } else {
        setMessage("Failed to add "+`${name}`+".");
      }
    } catch (error) {
      setMessage("Error adding player.");
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
          <PhoneInput
            placeholder="Enter phone number"
            value={phone}
            onChange={(value) => setPhone(value ?? '')}
            defaultCountry="US"
            className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
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