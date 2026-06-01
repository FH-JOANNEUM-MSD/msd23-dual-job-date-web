import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
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
        const body = await request.json();

        const response = await fetch(`${BACKEND_BASE_URL}/api/resend-invite`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                Accept: "application/json, text/plain",
            },
            body: JSON.stringify(body),
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
        console.error("Proxy resend-invite error:", error);
        return NextResponse.json(
            { error: "proxy_resend_invite_failed" },
            { status: 502 }
        );
    }
}