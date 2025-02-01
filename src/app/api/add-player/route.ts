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

    const { data: player, error } = await supabase
      .from("players")
      .insert([
        {
          name,
          group_id: groupId,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ player }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid request: ${err}` },
      { status: 400 }
    );
  }
}