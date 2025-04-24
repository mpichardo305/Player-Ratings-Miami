'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/utils/supabaseClient'

export function usePlayerName(playerId: string | undefined) {
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchName() {
      if (!playerId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('players')
          .select('name')
          .eq('id', playerId)
          .single()

        if (error) throw error

        setPlayerName(data?.name || null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch player name'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchName()
  }, [playerId])

  return { playerName, isLoading, error }
}