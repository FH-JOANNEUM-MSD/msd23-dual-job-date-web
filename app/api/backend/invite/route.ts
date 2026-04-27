import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "missing_authorization_header" }, { status: 401 });
  }

  if (!BACKEND_BASE_URL) {
    return NextResponse.json({ error: "missing_backend_base_url" }, { status: 500 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE_URL}/api/invite`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      body: JSON.stringify(body),
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

    if (typeof payload === "string") {
      return new NextResponse(payload, {
        status: response.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Proxy invite error:", error);
    return NextResponse.json({ error: "proxy_fetch_failed" }, { status: 502 });
  }
}