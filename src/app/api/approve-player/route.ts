import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

export async function POST(req: Request) {
  try {
    const { playerId, userId } = await req.json();

    // First, get the player's group
    const { data: player } = await supabase
      .from("players")
      .select("group_id")
      .eq("id", playerId)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Check if user is admin of the group
    const { data: isAdmin } = await supabase
      .from("group_members")
      .select("role")
      .eq("user_id", userId)
      .eq("group_id", player.group_id)
      .eq("role", "admin")
      .single();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Only group admins can approve players" },
        { status: 403 }
      );
    }

    // Approve player request
    const { error } = await supabase
      .from("players")
      .update({ status: "approved" })
      .eq("id", playerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Player approved!" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: `Invalid request: ${err}` }, { status: 400 });
  }
}