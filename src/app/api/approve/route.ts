// /app/api/players/approve/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";
import twilioClient from "@/app/utils/twilioClient";
import { v4 as uuidv4 } from "uuid";

interface ApprovalRequest {
  playerId: string;
}

export async function POST(req: Request) {
  try {
    const { playerId }: ApprovalRequest = await req.json();
    
    if (!playerId) {
      return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
    }

    // Generate invite token
    const inviteToken = uuidv4();

    // Update player's status to 'approved' and fetch the player's phone number
    const { data: playerData, error: updateError } = await supabase
      .from('players')
      .update({ status: 'approved' })
      .eq('id', playerId)
      .select('phone')
      .single();

    if (updateError || !playerData) {
      console.error("Error updating player status:", updateError);
      return NextResponse.json(
        { error: updateError?.message || "Player update failed" },
        { status: 500 }
      );
    }

    // Insert the invite into the invites table
    const { error: insertError } = await supabase
      .from('invites')
      .insert({
        player_id: playerId,
        token: inviteToken,
        used: false,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error creating invite:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Invite creation failed" },
        { status: 500 }
      );
    }

    // Prepare the approval data object
    const approvalData = {
      invite_token: inviteToken,
      phone: playerData.phone,
    };

    // Configuration check for SMS sending
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: "Missing configuration" },
        { status: 500 }
      );
    }
    const { data: inviteCheck, error: checkError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', approvalData.invite_token)
      .eq('used', false)
      .single();

    if (checkError || !inviteCheck) {
      return NextResponse.json(
        { error: "Invalid or expired invite token" },
        { status: 400 }
      );
    }

    const { error: updateInviteError } = await supabase
      .from('invites')
      .update({ used: true })
      .eq('token', approvalData.invite_token);

    if (updateInviteError) {
      return NextResponse.json(
        { error: "Failed to update invite status" },
        { status: 500 }
      );
    }

    // Then continue with existing code for inviteLink and SMS sending
    const inviteLink = `${baseUrl}/invite?token=${approvalData.invite_token}`;

    // Send SMS notification
    try {
      await twilioClient.messages.create({
        body: `You've been approved for Player Ratings! Sign up here: ${inviteLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: approvalData.phone,
      });

      return NextResponse.json({
        message: "Player approved and invite sent",
        inviteToken: approvalData.invite_token,
      });
    } catch (smsError) {
      console.error("SMS Error:", smsError);
      // Note: The player is approved even if SMS fails
      return NextResponse.json(
        {
          message: "Player approved but SMS failed",
          inviteToken: approvalData.invite_token,
          smsError: smsError instanceof Error ? smsError.message : "Unknown error",
        },
        { status: 207 }
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}