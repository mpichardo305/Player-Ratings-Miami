import { getMostImproved } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const mostImproved = await getMostImproved();
    return NextResponse.json(mostImproved, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching most improved:', error);
    return NextResponse.json({ error: 'Failed to fetch most improved' }, { status: 500 });
  }
}