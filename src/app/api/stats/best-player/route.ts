import { getBestPlayer } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const bestPlayer = await getBestPlayer();
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