'use client'

import AssignTeams from '../../../components/AssignTeams'
import { useParams, useSearchParams } from 'next/navigation'

export default function AssignTeamsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params?.gameId as string
  const mode = searchParams?.get('mode') === 'view'

  return <AssignTeams gameId={gameId} mode={mode} />
}
