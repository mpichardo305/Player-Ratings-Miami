import { NextResponse } from 'next/server';
import { getLongestWinStreak } from '@/app/utils/playerStats';

export const revalidate = 300; // 5 minutes

// Update your API route (e.g., /api/stats/longest-win-streak)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return new Response('Group ID is required', { status: 400 });
  }

  const stats = await getLongestWinStreak(groupId);
  return new Response(JSON.stringify(stats));
}