import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

export async function POST(req: Request) {
  try {
    const { playerId } = await req.json();

    // Decline player request
    const { error } = await supabase
      .from("players")
      .update({ status: "declined" })
      .eq("id", playerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Player declined!" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: `Invalid request: ${err}` }, { status: 400 });
  }
}