import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

export async function POST(req: Request) {
  try {
    const { name, groupId } = await req.json();

    if (!name || !groupId) {
      return NextResponse.json(
        { error: "Name and group are required" },
        { status: 400 }
      );
    }

    // Insert new player into the players table
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .insert([{ name, status: "pending" }])
      .select()
      .single();

    if (playerError) {
      return NextResponse.json(
        { error: playerError.message },
        { status: 500 }
      );
    }

    // Insert the association into the group_memberships table
    const { data: membershipData, error: membershipError } = await supabase
      .from("group_memberships")
      .insert([
        {
          group_id: groupId,
          player_id: playerData.id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { player: playerData, membership: membershipData },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid request: ${err}` },
      { status: 400 }
    );
  }
}