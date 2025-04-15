'use client'

import AssignTeams from '../../../components/AssignTeams'
import { useSearchParams } from 'next/navigation'

export default function AssignTeamsPage({
  params
}: {
  params: { gameId: string }
}) {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')

  return <AssignTeams gameId={params.gameId} mode={mode === 'view'} />
}