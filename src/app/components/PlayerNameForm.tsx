'use client'

import { useState } from 'react'
import PageBackground from './PageBackground'

interface PlayerNameFormProps {
  onSubmit: (name: string) => void;
}

export default function PlayerNameForm({ onSubmit }: PlayerNameFormProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <PageBackground>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2">
            What's your name?
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            placeholder="Enter full name"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white text-lg p-2 rounded hover:bg-green-700"
        >
          Continue
        </button>
      </form>
    </PageBackground>
  )
}