'use client'

import { useState } from 'react'

interface InviteDialogProps {
  groupId: string
  onClose: () => void
}

export default function InviteDialog({ groupId, onClose }: InviteDialogProps) {
  const [inviteUrl, setInviteUrl] = useState('')
  const [error, setError] = useState('')
  const [copyConfirmation, setCopyConfirmation] = useState(false)

  const createInvite = async () => {
    if (inviteUrl) {
      handleClose()
      return
    }

    try {
      console.log('Creating invite for groupId:', groupId)
      const response = await fetch('/api/create-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      console.log('Response from create-invite API:', data)
      
      if (data.error) {
        setError(data.error)
      } else if (data.token) {
        setInviteUrl(`${window.location.origin}/invite/${data.token}`)
      }
    } catch (err) {
      console.error('Error creating invite:', err)
      setError('Failed to create invite')
      setInviteUrl('')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopyConfirmation(true)
    setTimeout(() => setCopyConfirmation(false), 2000)
  }

  const handleClose = () => {
    console.log('Closing dialog...')
    setInviteUrl('') 
    setError('') 
    onClose() 
  }

  return (
    <div className="mt-4">
      <button 
        onClick={createInvite} 
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Invite a Player
      </button>
      
      {inviteUrl && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg text-white">
          <p className="mb-2 text-lg">Invite URL:</p>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              value={inviteUrl} 
              readOnly 
              className="w-full p-2 border border-gray-500 rounded bg-gray-800 text-white"
            />
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <button 
                  onClick={handleCopy}
                  className="w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors duration-200 text-gray-800"
                >
                  Copy  
                </button>
                {copyConfirmation && (
                  <div className="absolute -bottom-12 left-0 right-0 text-center text-lg font-semibold text-green-600 bg-green-100 p-2 rounded-md shadow-sm">
                    Link copied!
                  </div>
                )}
              </div>
              <button 
                onClick={handleClose}
                className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors duration-200 text-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-red-500">{error}</p>
      )}
    </div>
  )
}