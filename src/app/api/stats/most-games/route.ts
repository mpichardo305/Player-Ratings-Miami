import { getMostGamesPlayed } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const mostGames = await getMostGamesPlayed();
    return NextResponse.json(mostGames, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching most games played:', error);
    return NextResponse.json({ error: 'Failed to fetch most games played' }, { status: 500 });
  }
}