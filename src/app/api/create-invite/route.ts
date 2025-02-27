import { NextResponse } from 'next/server'
import { createInvite, validateInvite } from '@/app/actions/invite'

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
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' }, 
      { status: 400 }
    )
  }

  const result = await validateInvite(token)
  return NextResponse.json(result)
}