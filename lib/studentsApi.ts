import { apiFetch } from "./apiClient";

export type Student = {
  id: string;
  userId: string;
  name: string;
  studyProgram: string;
  semester: number | null;
};

type StudentApiDto = {
  id?: string | number;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  study_program?: string;
  semester?: number;
};

export type UpdateStudentInput = {
  first_name?: string;
  last_name?: string;
  study_program?: string;
  semester?: number;
};


function buildDisplayName(dto: StudentApiDto): string {
  const first = dto.first_name?.trim() ?? "";
  const last = dto.last_name?.trim() ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || "Unbekannt";
}

function mapStudent(dto: StudentApiDto): Student {
  return {
    id: String(dto.id ?? ""),
    userId: String(dto.user_id ?? ""),
    name: buildDisplayName(dto),
    studyProgram: dto.study_program?.trim() || "Nicht angegeben",
    semester: typeof dto.semester === "number" ? dto.semester : null,
  };
}

export async function getStudents(): Promise<Student[]> {
  const data = await apiFetch<StudentApiDto[]>("/api/backend/students");
  if (!Array.isArray(data)) return [];
  return data.map(mapStudent);
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  return apiFetch(`/api/backend/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteStudent(id: string) {
  return apiFetch(`/api/backend/students/${id}`, {
    method: "DELETE",
  });
}