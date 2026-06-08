import { NextRequest } from "next/server";
import { proxyBackendRequest } from "@/app/api/backend/_proxy";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    return proxyBackendRequest({
        request,
        method: "GET",
        backendPath: `/api/companies/${id}/meetings`,
    });
}