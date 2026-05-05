import { apiFetch } from "./apiClient";

export type CompanyStatus = "Aktiv" | "Inaktiv";

export type Company = {
    id: string;
    userId: string;
    name: string;
    description: string;
    website: string;
    status: CompanyStatus;
};

type CompanyApiDto = {
    id?: string | number;
    user_id?: string;
    name?: string;
    description?: string;
    website?: string;
    active?: boolean;
    status?: string | boolean | null;
};

export type UpdateCompanyInput = {
    name: string;
    description?: string;
    website?: string;
    active?: boolean;
};

function mapCompanyStatus(dto: CompanyApiDto): CompanyStatus {
    if (typeof dto.active === "boolean") {
        return dto.active ? "Aktiv" : "Inaktiv";
    }

    if (typeof dto.status === "boolean") {
        return dto.status ? "Aktiv" : "Inaktiv";
    }

    if (typeof dto.status === "string") {
        const normalized = dto.status.trim().toLowerCase();
        if (["aktiv", "active", "1", "true"].includes(normalized)) {
            return "Aktiv";
        }
    }

    return "Inaktiv";
}

function mapCompany(dto: CompanyApiDto): Company {
    return {
        id: String(dto.id ?? crypto.randomUUID()),
        userId: String(dto.user_id ?? ""),
        name: dto.name?.trim() || "Unbekannt",
        description: dto.description?.trim() || "Nicht angegeben",
        website: dto.website?.trim() || "",
        status: mapCompanyStatus(dto),
    };
}

export async function getCompanies(): Promise<Company[]> {
    const data = await apiFetch<CompanyApiDto[]>("/api/backend/companies");
    if (!Array.isArray(data)) return [];
    return data.map(mapCompany);
}

export async function updateCompany(id: string, input: UpdateCompanyInput) {
    return apiFetch(`/api/backend/companies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteCompany(id: string) {
    return apiFetch(`/api/backend/companies/${id}`, {
        method: "DELETE",
    });
}

export async function getCompanyById(id: string): Promise<Company> {
    const data = await apiFetch<CompanyApiDto>(`/api/backend/companies/${id}`);
    return mapCompany(data);
}