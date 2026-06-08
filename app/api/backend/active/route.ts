import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../_proxy";

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    method: "GET",
    backendPath: "/api/events/active",
  });
}