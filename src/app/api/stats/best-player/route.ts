import { getBestPlayer } from '@/app/utils/playerStats';
import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return new Response('Group ID is required', { status: 400 });
  }

  try {
    const bestPlayer = await getBestPlayer(groupId);
    return NextResponse.json(bestPlayer, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching best player:', error);
    return NextResponse.json({ error: 'Failed to fetch best player' }, { status: 500 });
  }
}