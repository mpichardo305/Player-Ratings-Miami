'use client'

import AssignScore from '../../../components/AssignScore'
import { useParams, useSearchParams } from 'next/navigation'

export default function ScorePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params?.gameId as string
  const mode = searchParams?.get('mode') === 'view'

  return <AssignScore gameId={gameId} mode={mode} />
}