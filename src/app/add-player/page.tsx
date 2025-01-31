"use client";

import { useState } from "react";

export default function AddPlayer() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setMessage("Player name is required.");
      return;
    }

    const response = await fetch("/api/add-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(`✅ "${name}" was added!`);
      setName(""); // Clear input
    } else {
      setMessage(`❌ Error: ${data.error}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white text-center">Add New Player</h2>

        <div className="mt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
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
      </div>
    </div>
  );
}