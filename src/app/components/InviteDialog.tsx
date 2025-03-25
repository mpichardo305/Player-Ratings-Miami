'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toaster"

interface InviteDialogProps {
  groupId: string
  onClose: () => void
}

export default function InviteDialog({ groupId, onClose }: InviteDialogProps) {
  const [inviteUrl, setInviteUrl] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const createInvite = async () => {
    if (inviteUrl) {
      handleClose()
      return
    }

    try {
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
      
      if (data.error) {
        setError(data.error)
      } else if (data.token) {
        setInviteUrl(`${window.location.origin}/invite/${data.token}`)
        setIsOpen(true)
      }
    } catch (err) {
      setError('Failed to create invite')
      setInviteUrl('')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    toast({
      title: "Link copied!",
      description: "The invite link has been copied to your clipboard.",
      duration: 2000,
    })
  }

  const handleClose = () => {
    setInviteUrl('') 
    setError('') 
    setIsOpen(false)
    onClose() 
  }

  return (
    <div className="mt-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            onClick={createInvite} 
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Invite a Player
          </Button>
        </DialogTrigger>
        {inviteUrl && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Player</DialogTitle>
              <DialogDescription>
                Share this link with the player you want to invite.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                value={inviteUrl}
                readOnly
                className="w-full"
              />
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={handleCopy}
                >
                  Copy Link
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={handleClose}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {error && (
        <p className="mt-2 text-destructive">{error}</p>
      )}
    </div>
  )
}