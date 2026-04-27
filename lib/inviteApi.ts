import { apiFetch } from "@/lib/apiClient";

export async function inviteStudent(params: {
  email: string;
  studyProgram: string;
  semester: number;
}) {
  return apiFetch<string>("/api/backend/invite", {
    method: "POST",
    body: JSON.stringify({
      email: params.email.trim(),
      role: "student",
      study_program: params.studyProgram.trim(),
      semester: params.semester,
    }),
  });
}

export async function inviteCompany(params: {
  email: string;
  companyName: string;
}) {
  return apiFetch<string>("/api/backend/invite", {
    method: "POST",
    body: JSON.stringify({
      email: params.email.trim(),
      role: "company",
      company_name: params.companyName.trim(),
    }),
  });
}