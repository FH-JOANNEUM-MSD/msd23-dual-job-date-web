import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../../_proxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "PATCH",
    backendPath: `/api/events/${eventId}`,
    body,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  return proxyBackendRequest({
    request,
    method: "DELETE",
    backendPath: `/api/events/${eventId}`,
  });
}