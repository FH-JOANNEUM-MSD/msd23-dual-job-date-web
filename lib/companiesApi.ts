// lib/companiesApi.ts
import { apiFetch } from "./apiClient";

export type CompanyStatus = "Aktiv" | "Inaktiv";

export type Company = {
    id: string;
    name: string;
    description: string;
    program: string;
    industry: string;
    website: string;
    status: CompanyStatus;
    locations?: string;
    jobDescription?: string;
};

type CompanyApiDto = {
    id?: string | number;
    name?: string;
    website?: string;
    industry?: string;
    study_program?: string;
    active?: boolean;
};

function mapCompany(dto: CompanyApiDto): Company {
    return {
        id: String(dto.id ?? crypto.randomUUID()),
        name: dto.name ?? "Unbekannt",
        description: "",
        program: dto.study_program ?? "Nicht angegeben",
        industry: dto.industry ?? "Nicht angegeben",
        website: dto.website ?? "",
        status: dto.active ? "Aktiv" : "Inaktiv",
    };
}

export async function getCompanies(): Promise<Company[]> {
    const data = await apiFetch<CompanyApiDto[]>("/api/backend/companies");
    if (!Array.isArray(data)) return [];
    return data.map(mapCompany);
}