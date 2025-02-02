// /app/api/groups/membership/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

interface AddMemberRequest {
  playerId: string;
  groupId: string;
}

export async function POST(req: Request) {
  try {
    const { playerId, groupId }: AddMemberRequest = await req.json();
    
    if (!playerId || !groupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check existing membership
    const { data: existingMembership } = await supabase
      .from("group_memberships")
      .select("id")
      .eq("player_id", playerId)
      .eq("group_id", groupId)
      .single();

    if (existingMembership) {
      return NextResponse.json({ 
        error: "Player already in group",
        membershipId: existingMembership.id 
      }, { status: 409 });
    }

    // Add to group with transaction
    const { data: membership, error: membershipError } = await supabase.rpc(
      'add_player_to_group',
      { 
        p_player_id: playerId,
        p_group_id: groupId
      }
    );

    if (membershipError) {
      console.error("Error adding to group:", membershipError);
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      membershipId: membership.id,
      status: 'pending'
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}