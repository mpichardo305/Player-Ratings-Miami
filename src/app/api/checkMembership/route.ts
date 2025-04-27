import { NextResponse } from 'next/server'
import { checkPlayerMembership } from '@/app/db/checkUserQueries'

export async function POST(request: Request) {
  const { phone, groupId } = await request.json()
  try {
    const result = await checkPlayerMembership(phone, groupId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ isMember: false, playerId: null, error: err.message }, { status: 500 })
  }
}