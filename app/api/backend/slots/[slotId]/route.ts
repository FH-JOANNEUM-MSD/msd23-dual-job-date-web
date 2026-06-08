import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../../_proxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await context.params;
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "PATCH",
    backendPath: `/api/slots/${slotId}`,
    body,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await context.params;

  return proxyBackendRequest({
    request,
    method: "DELETE",
    backendPath: `/api/slots/${slotId}`,
  });
}