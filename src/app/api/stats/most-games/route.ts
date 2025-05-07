import { getMostGamesPlayed } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return new Response('Group ID is required', { status: 400 });
  }

  const stats = await getMostGamesPlayed(groupId);
  return new Response(JSON.stringify(stats));
}