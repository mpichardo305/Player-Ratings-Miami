import { NextResponse } from 'next/server';
import { getLongestWinStreak } from '@/app/utils/playerStats';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const data = await getLongestWinStreak();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}