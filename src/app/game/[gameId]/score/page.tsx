'use client'

import AssignScore from '../../../components/AssignScore'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGroup } from '@/app/context/GroupContext'

export default function ScorePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = params?.gameId as string
  const mode = searchParams?.get('mode') === 'view'
  const [initialLoad, setInitialLoad] = useState(true)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const { isCurrentGroupAdmin } = useGroup()

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !mode && !isCurrentGroupAdmin) {
      console.log("Redirecting to view mode - not an admin")
      router.push(`/game/${gameId}?mode=view`)
    }
    setInitialLoad(false)
    setAdminCheckComplete(true)
  }, [initialLoad, adminCheckComplete, isCurrentGroupAdmin, mode, gameId, router])

  return <AssignScore gameId={gameId} mode={mode} />
}