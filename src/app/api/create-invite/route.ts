import { NextResponse } from 'next/server'
import { createInvite } from '@/app/actions/invite'

export async function POST(request: Request) {
  try {
    const { groupId } = await request.json()
    console.log('Received groupId:', groupId)
    
    const result = await createInvite(groupId)
    console.log('Result from createInvite:', result)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    
    return NextResponse.json(result.data, { status: 200 })
  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}