import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ProxyOptions = {
  request: NextRequest;
  backendPath: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function proxyBackendRequest({
  request,
  backendPath,
  method,
  body,
}: ProxyOptions) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "missing_authorization_header" },
      { status: 401 }
    );
  }

  if (!BACKEND_BASE_URL) {
    return NextResponse.json(
      { error: "missing_backend_base_url" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${backendPath}`, {
      method,
      headers: {
        Authorization: authHeader,
        Accept: "application/json, text/plain",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "backend_request_failed",
          backendStatus: response.status,
          backendPayload: payload,
        },
        { status: response.status }
      );
    }

    return isJson
      ? NextResponse.json(payload, { status: response.status })
      : new NextResponse(payload, {
          status: response.status,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
  } catch (error) {
    console.error(`Proxy ${method} ${backendPath} failed:`, error);
    return NextResponse.json(
      { error: "proxy_fetch_failed" },
      { status: 502 }
    );
  }
}