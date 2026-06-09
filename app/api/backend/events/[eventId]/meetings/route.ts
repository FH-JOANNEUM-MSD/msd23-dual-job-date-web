import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../../../_proxy";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "PUT",
    backendPath: `/api/events/${eventId}/meetings`,
    body,
  });
}
