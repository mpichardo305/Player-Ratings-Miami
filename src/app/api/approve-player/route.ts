import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

interface ApprovePlayerRequest {
  id: string;
  name: string;
  groupId: string;
  phone: string;
}

export async function POST(req: Request) {
  try {
    const body: ApprovePlayerRequest = await req.json();
    const { id, groupId } = body;

    // 1. Add to Group
    const membershipRes = await fetch(`${req.headers.get('origin')}/api/groups/membership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId: id,
        groupId
      })
    });

    if (!membershipRes.ok && membershipRes.status !== 409) {
      const membershipText = await membershipRes.text();
      let error;
      try {
        error = JSON.parse(membershipText);
      } catch {
        error = { message: membershipText };
      }
      return NextResponse.json({ error: error.message }, { status: membershipRes.status });
    }

    // 2. Approve and Send Invite
    const approvalRes = await fetch(`${req.headers.get('origin')}/api/players/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId: id
      })
    });

    const approvalText = await approvalRes.text();
    console.log('Approval Response:', approvalRes.status, approvalRes.headers.get('content-type'), approvalText);

    if (!approvalRes.ok) {
      let error;
      try {
        error = JSON.parse(approvalText);
      } catch {
        error = { message: approvalText };
      }
      return NextResponse.json({ error: error.message }, { status: approvalRes.status });
    }

    let approvalData;
    try {
      approvalData = JSON.parse(approvalText);
    } catch (e) {
      console.error('Failed to parse approval response:', e);
      return NextResponse.json({ error: "Invalid response from approval service" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Player approved and invite sent successfully",
      token: approvalData.inviteToken
    });

  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}