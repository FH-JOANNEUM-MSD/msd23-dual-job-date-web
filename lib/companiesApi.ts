import { apiFetch } from "./apiClient";

export type CompanyStatus = "Aktiv" | "Inaktiv";

export type Company = {
    id: string;
    userId: string;
    name: string;
    shortDescription: string;
    description: string;
    website: string;
    logoUrl: string;
    imageUrls: string[];
    status: CompanyStatus;
    lastUpdated?: string;
};

type CompanyApiDto = {
    id?: string | number;
    user_id?: string;
    name?: string;
    short_description?: string;
    description?: string;
    website?: string;
    logo_url?: string;
    image_urls?: string;
    active?: boolean;
    status?: string | boolean | null;
    last_updated?: string;
};

export type UpdateCompanyInput = {
    name?: string;
    short_description?: string;
    description?: string;
    website?: string;
    logo_url?: string;
    image_urls?: string;
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
        name: dto.name?.trim() || "",
        shortDescription: dto.short_description?.trim() || "",
        description: dto.description?.trim() || "",
        website: dto.website?.trim() || "",
        logoUrl: dto.logo_url?.trim() || "",
        imageUrls: dto.image_urls
            ? dto.image_urls.split(";").map((url) => url.trim()).filter(Boolean)
            : [],
        status: mapCompanyStatus(dto),
        lastUpdated: dto.last_updated,
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

export async function uploadCompanyLogo(companyId: string, file: File) {
    const formData = new FormData();
    formData.append("logo", file);

    return apiFetch(`/api/backend/companies/${companyId}/logo`, {
        method: "POST",
        body: formData,
    });
}

export async function uploadCompanyImage(companyId: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);

    return apiFetch(`/api/backend/companies/${companyId}/images`, {
        method: "POST",
        body: formData,
    });
}