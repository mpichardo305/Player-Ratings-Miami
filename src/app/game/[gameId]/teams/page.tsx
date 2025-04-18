'use client'

import AssignTeams from '../../../components/AssignTeams'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGroup } from '@/app/context/GroupContext'
import { useSession } from '@/app/hooks/useSession'

export default function AssignTeamsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = params?.gameId as string
  const mode = searchParams?.get('mode') === 'view'
  
  const [initialLoad, setInitialLoad] = useState(true)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const session = useSession()
  const { isCurrentGroupAdmin } = useGroup()

  useEffect(() => {
    if (!initialLoad && adminCheckComplete && !mode && !isCurrentGroupAdmin) {
      console.log("Redirecting to view mode - not an admin")
      router.push(`/game/${gameId}?mode=view`)
    }
    setInitialLoad(false)
    setAdminCheckComplete(true)
  }, [initialLoad, adminCheckComplete, isCurrentGroupAdmin, mode, gameId, router])

  return <AssignTeams gameId={gameId} mode={mode} />
}
