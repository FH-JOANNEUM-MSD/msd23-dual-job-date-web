import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../../_proxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await context.params;
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "PATCH",
    backendPath: `/api/meetings/${meetingId}`,
    body,
  });
}

// NOTE: retained until Task 4 removes the last `deleteMeeting()` caller in
// app/(app)/events/page.tsx. lib/meetingsApi.ts `deleteMeeting()` still DELETEs
// here at this commit, so dropping it now would 404 at runtime.
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await context.params;

  return proxyBackendRequest({
    request,
    method: "DELETE",
    backendPath: `/api/meetings/${meetingId}`,
  });
}