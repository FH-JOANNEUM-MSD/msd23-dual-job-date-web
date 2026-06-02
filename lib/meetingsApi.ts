import { apiFetch } from "@/lib/apiClient";

export type BackendMeeting = {
  id: string;
  slotId: string;
  slotStartTime: string;
  slotEndTime: string;
  studentId: string;
  studentName: string;
  companyId: string;
};

type BackendMeetingDto = {
  id?: string | number;
  slot_id?: string | number;
  slot_start_time?: string;
  slot_end_time?: string;
  student_id?: string | number;
  student_first_name?: string;
  student_last_name?: string;
  company_id?: string | number;
};

function mapBackendMeeting(dto: BackendMeetingDto): BackendMeeting {
  const firstName = dto.student_first_name?.trim() ?? "";
  const lastName = dto.student_last_name?.trim() ?? "";
  const studentName = `${firstName} ${lastName}`.trim() || "Unbekannt";

  return {
    id: String(dto.id ?? ""),
    slotId: String(dto.slot_id ?? ""),
    slotStartTime: dto.slot_start_time ?? "",
    slotEndTime: dto.slot_end_time ?? "",
    studentId: String(dto.student_id ?? ""),
    studentName,
    companyId: String(dto.company_id ?? ""),
  };
}

export async function getAllMeetings(): Promise<BackendMeeting[]> {
  const data = await apiFetch<BackendMeetingDto[]>("/api/backend/meetings");
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendMeeting);
}

export async function getMeetingsForCompany(companyId: string): Promise<BackendMeeting[]> {
  const data = await apiFetch<BackendMeetingDto[]>(
    `/api/backend/meetings/company/${companyId}`
  );

  if (!Array.isArray(data)) return [];
  return data.map(mapBackendMeeting);
}