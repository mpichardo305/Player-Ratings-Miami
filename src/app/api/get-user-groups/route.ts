import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

function errorResponse(message: string, status: number = 500) {
  console.error("Error Response:", message);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  console.log("Received GET request.");

  // Extract token from cookies (assuming the cookie name is 'token')
  const tokenCookie = request.cookies.get('token');
  console.log("Cookie token:", tokenCookie);
  if (!tokenCookie || !tokenCookie.value) {
    return errorResponse('Unauthorized', 401);
  }
  const token = tokenCookie.value;
  console.log("Extracted token from cookie:", token);

  // Create Supabase client with the token from the cookie
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  // Get the session (which includes the access_token)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log("Session data:", sessionData, "Session error:", sessionError);
  if (sessionError || !sessionData || !sessionData.session) {
    return errorResponse('Unauthorized', 401);
  }

  const { session } = sessionData;
  const accessToken = session.access_token;
  console.log("Access token from session:", accessToken);

  // Optional: Compare the cookie token with the session access token
  if (token !== accessToken) {
    console.warn("Cookie token does not match the session access token.");
  }

  // Use the authenticated user from the session
  const user = session.user;
  console.log("Authenticated user:", user);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  // Fetch group_admins for the current user
  const { data: groupAdmins, error: groupAdminsError } = await supabase
    .from('group_admins')
    .select('group_id')
    .eq('player_id', user.id);
  console.log("Fetched group_admins:", groupAdmins, "Error:", groupAdminsError);
  if (groupAdminsError) {
    return errorResponse(groupAdminsError.message);
  }
  if (!groupAdmins || groupAdmins.length === 0) {
    console.log("No group_admins found for user:", user.id);
    return NextResponse.json({ groups: [] });
  }

  // Extract group IDs and fetch corresponding groups details
  const groupIds = groupAdmins.map(row => row.group_id);
  console.log("Group IDs to fetch:", groupIds);
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name')
    .in('id', groupIds);
  console.log("Fetched groups:", groups, "Error:", groupsError);
  if (groupsError) {
    return errorResponse(groupsError.message);
  }

  console.log("Returning groups:", groups);
  return NextResponse.json({ groups });
}