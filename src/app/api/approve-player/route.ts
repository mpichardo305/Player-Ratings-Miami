
import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

interface ApprovePlayerRequest {
  name: string;
  groupId: string;
  phone: string;
  userId: string;
}

export async function POST(req: Request) {
  try {
    const body: ApprovePlayerRequest = await req.json();
    const { name, groupId, phone, userId } = body;

    // Validate request
    if (!name || !groupId || !phone || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create/Get Player
    const playerRes = await fetch(`${req.headers.get('origin')}/api/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, phone })
    });

    if (!playerRes.ok) {
      const error = await playerRes.json();
      return NextResponse.json({ error: error.message }, { status: playerRes.status });
    }

    const playerData = await playerRes.json();

    // 2. Add to Group
    const membershipRes = await fetch(`${req.headers.get('origin')}/api/groups/membership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId: playerData.playerId,
        groupId
      })
    });

    if (!membershipRes.ok && membershipRes.status !== 409) { // 409 means already in group, which is OK
      const error = await membershipRes.json();
      return NextResponse.json({ error: error.message }, { status: membershipRes.status });
    }

    // 3. Approve and Send Invite
    const approvalRes = await fetch(`${req.headers.get('origin')}/api/players/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId: playerData.playerId
      })
    });

    if (!approvalRes.ok) {
      const error = await approvalRes.json();
      return NextResponse.json({ error: error.message }, { status: approvalRes.status });
    }

    const approvalData = await approvalRes.json();

    return NextResponse.json({
      message: "Player approved and invite sent successfully",
      token: approvalData.inviteToken
    });

  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}