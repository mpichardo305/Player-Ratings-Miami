import { NextResponse } from "next/server";
import { updateGroupMembership, updateInvitesTableViaPlayerId, updatePlayerStatusAndPhone } from "@/app/db/approvePlayerQueries";

interface ApprovePlayerRequest {
  id: string;
  name: string;
  groupId: string;
  phone: string;
}

export async function POST(req: Request) {
  try {
    const body: ApprovePlayerRequest = await req.json();
    const { id, groupId, phone } = body;
    // Sanitize phone number - add null check before using replace
    const sanitizedPhone = phone ? phone.replace(/\D/g, '') : '';

    // 1. Add to Group Update Invites Table
    const membershipRes = await updateGroupMembership(id, groupId);
    const inviteTab = await updateInvitesTableViaPlayerId(id);
    const playerRes = await updatePlayerStatusAndPhone(id, sanitizedPhone);
    if (membershipRes.error) {
      return NextResponse.json({ error: membershipRes.error.message }, { status: 400 });
    }
    if (inviteTab.error) {
      return NextResponse.json({ error: inviteTab.error.message }, { status: 400 });
    }
    if (playerRes.error) {
      return NextResponse.json({ error: playerRes.error }, { status: 400 });
    }
    
    // Return success response when all operations complete successfully
    return NextResponse.json({ success: true, message: "Player approved successfully" }, { status: 200 });

  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

