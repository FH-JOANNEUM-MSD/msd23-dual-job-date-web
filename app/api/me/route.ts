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
                Accept: "application/json",
            },
            cache: "no-store",
        });

        const payload = await response.json();
        return NextResponse.json(payload, { status: response.status });
    } catch (error) {
        console.error("Proxy /api/me error:", error);
        return NextResponse.json({ error: "proxy_fetch_failed" }, { status: 502 });
    }
}