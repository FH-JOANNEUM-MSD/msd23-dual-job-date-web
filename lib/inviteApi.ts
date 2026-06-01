import { apiFetch } from "@/lib/apiClient";

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName };
}

export async function inviteStudent(params: {
  email: string;
  fullName: string;
  studyProgram: string;
  semester: number;
}) {
  const { firstName, lastName } = splitFullName(params.fullName);

  return apiFetch<string>("/api/backend/invite", {
    method: "POST",
    body: JSON.stringify({
      email: params.email.trim(),
      role: "student",
      study_program: params.studyProgram.trim(),
      semester: params.semester,
      first_name: firstName,
      last_name: lastName,
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

export async function resendInvite(params: {
  email: string;
  role: "student" | "company";
}) {
  return apiFetch<{ message: string }>("/api/backend/resend-invite", {
    method: "POST",
    body: JSON.stringify({
      email: params.email.trim(),
      role: params.role,
    }),
  });
}