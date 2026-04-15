// lib/studentsApi.ts
import { apiFetch } from "./apiClient";

export type StudentStatus = "Aktiv" | "Inaktiv";

export type Student = {
  id: string;
  name: string;
  email: string;
  program: string;          // display value for tables
  studyProgram: string;     // raw value for filtering
  semester: number | null;  // raw value for filtering
  status: StudentStatus;
};

type StudentApiDto = {
  id?: string | number;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  study_program?: string;
  semester?: number;
  email?: string;
  eMail?: string;
  status?: string | boolean | null;
};

function mapStudentStatus(value: unknown): StudentStatus {
  if (typeof value === "boolean") {
    return value ? "Aktiv" : "Inaktiv";
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "aktiv" ||
      normalized === "active" ||
      normalized === "1" ||
      normalized === "true"
    ) {
      return "Aktiv";
    }
  }

  return "Inaktiv";
}

function buildDisplayName(dto: StudentApiDto): string {
  const first = dto.first_name?.trim() ?? "";
  const last = dto.last_name?.trim() ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || "Unbekannt";
}

function buildProgram(studyProgram: string, semester: number | null): string {
  if (!studyProgram) return "Nicht angegeben";
  if (typeof semester === "number") {
    return `${studyProgram} (Semester ${semester})`;
  }
  return studyProgram;
}

function mapStudent(dto: StudentApiDto): Student {
  const studyProgram = dto.study_program?.trim() ?? "Nicht angegeben";
  const semester = typeof dto.semester === "number" ? dto.semester : null;

  return {
    id: String(dto.id ?? dto.user_id ?? crypto.randomUUID()),
    name: buildDisplayName(dto),
    email: dto.email?.trim() || dto.eMail?.trim() || "",
    program: buildProgram(studyProgram, semester),
    studyProgram,
    semester,
    status: mapStudentStatus(dto.status ?? true),
  };
}

export async function getStudents(): Promise<Student[]> {
  const data = await apiFetch<StudentApiDto[]>("/api/backend/students");
  if (!Array.isArray(data)) return [];
  return data.map(mapStudent);
}