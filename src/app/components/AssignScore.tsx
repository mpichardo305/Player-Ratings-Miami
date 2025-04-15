'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGroupAdmin } from "../hooks/useGroupAdmin"
import { useSession } from "../hooks/useSession"
import { Loader2 } from "lucide-react"

interface AssignScoreProps {
  gameId: string
  mode?: boolean
}

export default function AssignScore({ gameId, mode = false }: AssignScoreProps) {
  const [scoreA, setScoreA] = useState<string>('')
  const [scoreB, setScoreB] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeInput, setActiveInput] = useState<'A' | 'B' | null>(null)
  const router = useRouter()
  const session = useSession()
  const [selectedGroup, setSelectedGroup] = useState<{ id: string } | null>(null)
  const isGroupAdmin = useGroupAdmin(session?.user?.id ?? '', selectedGroup?.id ?? '')

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/score`)
        if (!response.ok) throw new Error('Failed to fetch score')
        
        const data = await response.json()
        if (data.scoreA !== undefined && data.scoreB !== undefined) {
          setScoreA(data.scoreA.toString())
          setScoreB(data.scoreB.toString())
        }
      } catch (error) {
        console.error("Error fetching score:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScore()
  }, [gameId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading score...</span>
      </div>
    )
  }

  const handleNumberInput = (num: number) => {
    if (activeInput === 'A') {
      if (scoreA.length < 2) { // Limit to 2 digits
        setScoreA(prev => prev + num.toString())
      }
    } else if (activeInput === 'B') {
      if (scoreB.length < 2) { // Limit to 2 digits
        setScoreB(prev => prev + num.toString())
      }
    }
  }

  const handleDelete = () => {
    if (activeInput === 'A') {
      setScoreA(prev => prev.slice(0, -1))
    } else if (activeInput === 'B') {
      setScoreB(prev => prev.slice(0, -1))
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/assign-score`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scoreA: parseInt(scoreA),
          scoreB: parseInt(scoreB)
        })
      })

      if (!response.ok) {
        throw new Error("Failed to assign scores")
      }

      router.push(`/rate-players/${gameId}`)
    } catch (error) {
      console.error("Error assigning scores:", error)
    }
  }

  const NumberPad = () => (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button
          key={num}
          onClick={() => handleNumberInput(num)}
          className="h-16 text-2xl"
          variant="outline"
          disabled={!activeInput || !isGroupAdmin || mode}
        >
          {num}
        </Button>
      ))}
      <Button
        onClick={handleDelete}
        className="h-16 text-2xl"
        variant="outline"
        disabled={!activeInput || !isGroupAdmin || mode}
      >
        ←
      </Button>
      <Button
        onClick={() => handleNumberInput(0)}
        className="h-16 text-2xl"
        variant="outline"
        disabled={!activeInput || !isGroupAdmin || mode}
      >
        0
      </Button>
      <Button
        onClick={() => setActiveInput(null)}
        className="h-16 text-2xl"
        variant="outline"
        disabled={!activeInput || !isGroupAdmin || mode}
      >
        Done
      </Button>
    </div>
  )

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">
          Enter Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-3 gap-4 items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-4 font-bold">Team A</span>
              <Button
                variant={activeInput === 'A' ? "default" : "outline"}
                onClick={() => setActiveInput('A')}
                className="w-full h-24 text-4xl"
                disabled={!isGroupAdmin || mode}
              >
                {scoreA || '0'}
              </Button>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold">-</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl mb-4 font-bold">Team B</span>
              <Button
                variant={activeInput === 'B' ? "default" : "outline"}
                onClick={() => setActiveInput('B')}
                className="w-full h-24 text-4xl"
                disabled={!isGroupAdmin || mode}
              >
                {scoreB || '0'}
              </Button>
            </div>
          </div>

          {activeInput && <NumberPad />}

          <div className="flex flex-col space-y-4">
            {!mode && isGroupAdmin && (
              <Button 
                onClick={handleSubmit}
                className="w-full h-12 text-lg"
                disabled={!scoreA || !scoreB}
              >
                Submit Score
              </Button>
            )}
            
            

            <Button
              variant="outline"
              onClick={() => router.push(`/game/${gameId}?mode=view`)}
              className="w-full h-12 text-lg"
            >
              Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}