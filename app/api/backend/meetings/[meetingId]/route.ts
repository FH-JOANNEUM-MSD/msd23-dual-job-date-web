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