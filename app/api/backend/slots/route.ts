import { NextRequest } from "next/server";
import { proxyBackendRequest } from "../_proxy";

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    method: "GET",
    backendPath: "/api/slots",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyBackendRequest({
    request,
    method: "POST",
    backendPath: "/api/slots",
    body,
  });
}