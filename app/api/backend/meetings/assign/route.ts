import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../../_proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "POST",
    backendPath: "/api/meetings/assign",
    body,
  });
}
