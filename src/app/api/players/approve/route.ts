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

    // Start a transaction for approval and invite creation
    const { data: approvalData, error: approvalError } = await supabase.rpc(
      'approve_player_and_create_invite',
      { 
        p_player_id: playerId,
        p_invite_token: uuidv4()
      }
    );
    console.log("Supabase RPC response:", {
      approvalData,
      approvalError,
      debug: approvalData?.debug_info
    });
    if (approvalError) {
      console.error("Error in approval process:", approvalError);
      return NextResponse.json({ error: approvalError.message }, { status: 500 });
    }

    // Send SMS if approval was successful
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    const inviteLink = `${baseUrl}/invite?token=${approvalData.invite_token}`;

    try {
      const message = await twilioClient.messages.create({
        body: `You've been approved for Player Ratings! Sign up here: ${inviteLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: approvalData.phone
      });

      return NextResponse.json({
        message: "Player approved and invite sent",
        inviteToken: approvalData.invite_token
      });

    } catch (smsError) {
      console.error("SMS Error:", smsError);
      // Note: Player is still approved even if SMS fails
      return NextResponse.json({
        message: "Player approved but SMS failed",
        inviteToken: approvalData.invite_token,
        smsError: smsError instanceof Error ? smsError.message : 'Unknown error'
      }, { status: 207 });
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}