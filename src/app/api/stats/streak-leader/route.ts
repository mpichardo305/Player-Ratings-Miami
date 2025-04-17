import { getStreakLeader } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const streakLeader = await getStreakLeader();
    return NextResponse.json(streakLeader, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching streak leader:', error);
    return NextResponse.json({ error: 'Failed to fetch streak leader' }, { status: 500 });
  }
}