import { apiFetch } from "@/lib/apiClient";

export type CurrentUser = {
    id?: string;
    user_id?: string;
    company_id?: string | number;
    companyId?: string | number;
    role?: "admin" | "company" | "student" | string;
    email?: string;
    status?: string;
};

export async function getCurrentUser(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>("/api/backend/me");
}