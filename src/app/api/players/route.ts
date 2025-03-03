// /app/api/players/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { PhoneFormatter } from "@/app/utils/PhoneFormatter";

interface CreatePlayerRequest {
  name: string;
  phone: string;
}

export async function POST(req: Request) {
  try {
    const { name, phone }: CreatePlayerRequest = await req.json();

    const standardizedPhone = PhoneFormatter.standardize(phone);

    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id, status")
      .eq("name", name)
      .single();

    if (existingPlayer) {
      return NextResponse.json({ 
        playerId: existingPlayer.id,
        status: existingPlayer.status,
        existed: true 
      });
    }

    // Create new player with transaction
    const { data: newPlayer, error: createError } = await supabase.rpc(
      'create_player_with_status',
      { 
        player_name: name,
        player_phone: standardizedPhone,
        player_status: 'pending'
      }
    );

    if (createError) {
      console.error("Error creating player:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      playerId: newPlayer.id,
      status: 'pending',
      existed: false 
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}