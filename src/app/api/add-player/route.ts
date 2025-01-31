import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // ✅ Read JSON input
    if (!body.name) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    // ✅ Insert player into Supabase
    const { data, error } = await supabase.from("players").insert([{ name: body.name }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Player was added successfully", player: data }, { status: 200 });
  } catch (err) {
    console.error("❌ API Error:", err); // ✅ Log the error to console
    return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
  }
}