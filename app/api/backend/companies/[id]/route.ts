import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeader(request: NextRequest) {
    return request.headers.get("authorization");
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const authHeader = getAuthHeader(request);
    const { id } = await context.params;

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

        const response = await fetch(`${BACKEND_BASE_URL}/api/companies/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: authHeader,
                Accept: "application/json",
                "Content-Type": "application/json",
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

        return NextResponse.json(
            isJson ? payload : { message: payload },
            { status: response.status }
        );
    } catch (error) {
        console.error("PATCH /companies/:id proxy error:", error);
        return NextResponse.json(
            { error: "proxy_patch_failed" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const authHeader = getAuthHeader(request);
    const { id } = await context.params;

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
        const response = await fetch(`${BACKEND_BASE_URL}/api/companies/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: authHeader,
                Accept: "application/json",
            },
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

        return NextResponse.json(
            isJson ? payload : { message: payload },
            { status: response.status }
        );
    } catch (error) {
        console.error("DELETE /companies/:id proxy error:", error);
        return NextResponse.json(
            { error: "proxy_delete_failed" },
            { status: 500 }
        );
    }
}