import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";
import twilioClient from "@/app/utils/twilioClient";
import { v4 as uuidv4 } from "uuid"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request Body:", body);

    const { name, groupId, phone, userId } = body;

    if (!name || !groupId || !phone || !userId) {
      console.error("Missing required fields in request body");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Extracted Data - Name:", name, "User ID:", userId, "Phone:", phone, "Group ID:", groupId);

    // 1. First check if the player exists in the database
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("name", name)
      .single();

    if (playerError) {
      console.error("Error checking for existing player:", playerError);
      return NextResponse.json({ error: "Error checking player" }, { status: 500 });
    }

    if (playerData) {
      // 2. If player exists, check if they're already in the group
      const { data: membershipData, error: membershipError } = await supabase
        .from("group_memberships")
        .select("player_id")
        .eq("group_id", groupId)
        .eq("player_id", playerData.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error("Error checking group membership:", membershipError);
        return NextResponse.json({ error: "Error checking membership" }, { status: 500 });
      }

      if (membershipData) {
        return NextResponse.json({ error: "Player already in group" }, { status: 409 });
      }
    }

    let playerId;

      // 2. Create a new player in the "players" table
      const newPlayerId = uuidv4();
      const { error: insertPlayerError } = await supabase
        .from("players")
        .insert([{ id: newPlayerId, name, phone, status: "pending" }]);
      
      if (insertPlayerError) {
        console.error("Error creating new player:", insertPlayerError);
        return NextResponse.json({ error: insertPlayerError.message }, { status: 500 });
      }
      
      // ✅ Now link the new player to the group in "group_memberships"
      const { error: insertMembershipError } = await supabase
        .from("group_memberships")
        .insert([{ group_id: groupId, player_id: newPlayerId, status: "pending" }]);
      
      if (insertMembershipError) {
        console.error("Error creating group membership:", insertMembershipError);
        return NextResponse.json({ error: insertMembershipError.message }, { status: 500 });
      }

    // 3. Approve the player - wrapped in transaction
        const { data: updateData, error: updateError } = await supabase
      .from("players")
      .update({ status: "approved" })
      .eq("id", newPlayerId)
      .select();

    console.log("🔄 Update Response:", updateData);

    if (updateError) {
      console.error("❌ Failed to update player status:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_BASE_URL || !process.env.TWILIO_PHONE_NUMBER) {
      console.error("Missing required environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 4. Generate an invite token and store it
    const inviteToken = uuidv4();
    const { error: insertInviteError } = await supabase
      .from("invites")
      .insert([{ 
        player_id: playerId, 
        token: inviteToken, 
        used: false,
        created_at: new Date().toISOString()
      }]);

    if (insertInviteError) {
      console.error("Error inserting invite:", insertInviteError);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    console.log("Invite generated:", inviteToken);

    // 5. Send SMS with invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    try {
      const message = await twilioClient.messages.create({
        body: `You've been approved for Player Ratings! Sign up here: ${inviteLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      console.log("Twilio Message Sent. SID:", message.sid);
      
      return NextResponse.json(
        { message: "Player approved and invite sent successfully", token: inviteToken },
        { status: 200 }
      );
    } catch (smsError) {
      console.error("Twilio SMS Error:", smsError);
      return NextResponse.json({ 
        error: "Failed to send invite SMS",
        details: smsError instanceof Error ? smsError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json({ error: `Invalid request: ${err}` }, { status: 400 });
  }
}