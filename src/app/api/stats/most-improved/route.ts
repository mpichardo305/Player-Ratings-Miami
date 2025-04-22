import { getMostImproved } from "@/app/utils/playerStats";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  if (!groupId) {
    return new Response('Group ID is required', { status: 400 });
  }
  try {
    const mostImproved = await getMostImproved(groupId);
    return new Response(JSON.stringify(mostImproved));
  } catch (error) {
    console.error('Error fetching most improved:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}