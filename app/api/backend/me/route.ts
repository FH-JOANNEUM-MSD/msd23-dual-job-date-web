import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ error: "missing_authorization_header" }, { status: 401 });
    }

    if (!BACKEND_BASE_URL) {
        return NextResponse.json({ error: "missing_backend_base_url" }, { status: 500 });
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/me`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                Accept: "application/json, text/plain",
            },
            cache: "no-store",
        });

        const contentType = response.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

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

        return NextResponse.json(payload, { status: response.status });
    } catch (error) {
        console.error("Proxy /me error:", error);
        return NextResponse.json({ error: "proxy_fetch_failed" }, { status: 502 });
    }
}