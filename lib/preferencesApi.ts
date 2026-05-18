import { apiFetch } from "./apiClient";

export type PreferenceType = "like" | "dislike" | "none";

export type Preference = {
    id: string;
    studentId: string;
    companyId: string;
    preferenceType: PreferenceType;
};

type PreferenceApiDto = {
    id?: string | number;
    student_id?: string | number;
    company_id?: string | number;
    preference_type?: string;
};

function mapPreferenceType(value: unknown): PreferenceType {
    if (value === "like" || value === "dislike" || value === "none") {
        return value;
    }
    return "none";
}

function mapPreference(dto: PreferenceApiDto): Preference {
    return {
        id: String(dto.id ?? ""),
        studentId: String(dto.student_id ?? ""),
        companyId: String(dto.company_id ?? ""),
        preferenceType: mapPreferenceType(dto.preference_type),
    };
}

export async function getAllPreferences(): Promise<Preference[]> {
    const data = await apiFetch<PreferenceApiDto[]>("/api/backend/all-preferences");
    if (!Array.isArray(data)) return [];
    return data.map(mapPreference);
}

export function preferenceKey(studentId: string, companyId: string): string {
    return `${studentId}::${companyId}`;
}

export function buildPreferenceMap(preferences: Preference[]): Map<string, PreferenceType> {
    const map = new Map<string, PreferenceType>();
    preferences.forEach((pref) => {
        map.set(preferenceKey(pref.studentId, pref.companyId), pref.preferenceType);
    });
    return map;
}
