import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../_proxy";

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    method: "GET",
    backendPath: "/api/allMeetings",
  });
}

// NOTE: retained until Task 4 removes the last `createMeeting()` caller in
// app/(app)/events/page.tsx. lib/meetingsApi.ts `createMeeting()` still POSTs
// here at this commit, so dropping it now would 405 at runtime.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "POST",
    backendPath: "/api/meetings",
    body,
  });
}
