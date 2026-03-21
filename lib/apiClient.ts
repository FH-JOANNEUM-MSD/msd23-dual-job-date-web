// lib/apiClient.ts
export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}

type ApiFetchOptions = RequestInit & {
    requiresAuth?: boolean;
};

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { requiresAuth = true, headers, ...rest } = options;
    const finalHeaders = new Headers(headers ?? {});
    finalHeaders.set("Accept", "application/json");

    const hasBody =
        rest.body !== undefined &&
        rest.body !== null &&
        !(rest.body instanceof FormData);

    if (hasBody && !finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
    }

    if (requiresAuth) {
        const token = getAccessToken();
        if (!token) {
            throw new ApiError("Kein Access Token gefunden. Bitte erneut einloggen.", 401);
        }
        finalHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(path, {
        ...rest,
        headers: finalHeaders,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        console.error("apiFetch error payload:", payload);

        let message = `Request fehlgeschlagen: ${response.status}`;

        if (typeof payload === "object" && payload !== null) {
            if (
                "backendPayload" in payload &&
                typeof (payload as { backendPayload?: unknown }).backendPayload === "string"
            ) {
                message = (payload as { backendPayload: string }).backendPayload;
            } else if (
                "error" in payload &&
                typeof (payload as { error?: unknown }).error === "string"
            ) {
                message = (payload as { error: string }).error;
            } else if ("backendPayload" in payload) {
                message = JSON.stringify((payload as { backendPayload: unknown }).backendPayload);
            }
        }
        throw new ApiError(message, response.status, payload);
    }
    return payload as T;
}