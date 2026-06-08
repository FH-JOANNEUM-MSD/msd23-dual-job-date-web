import { apiFetch } from "@/lib/apiClient";

export type BackendMeeting = {
  id: string;
  eventId: string;
  slotId: string;
  slotStartTime: string;
  slotEndTime: string;
  studentId: string;
  studentName: string;
  companyId: string;
};

type BackendMeetingDto = {
  id?: string | number;
  event_id?: string | number;
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
    eventId: String(dto.event_id ?? ""),
    slotId: String(dto.slot_id ?? ""),
    slotStartTime: dto.slot_start_time ?? "",
    slotEndTime: dto.slot_end_time ?? "",
    studentId: String(dto.student_id ?? ""),
    studentName,
    companyId: String(dto.company_id ?? ""),
  };
}

function toNumberId(value: string, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} ist keine gültige ID.`);
  }

  return numberValue;
}

export async function getAllMeetings(): Promise<BackendMeeting[]> {
  const data = await apiFetch<BackendMeetingDto[]>("/api/backend/meetings");
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendMeeting);
}

export async function createMeeting(input: {
  eventId: string;
  slotId: string;
  studentId: string;
  companyId: string;
}): Promise<BackendMeeting> {
  const data = await apiFetch<BackendMeetingDto>("/api/backend/meetings", {
    method: "POST",
    body: JSON.stringify({
      event_id: toNumberId(input.eventId, "event_id"),
      slot_id: toNumberId(input.slotId, "slot_id"),
      student_id: toNumberId(input.studentId, "student_id"),
      company_id: toNumberId(input.companyId, "company_id"),
    }),
  });

  return mapBackendMeeting(data);
}

export async function updateMeeting(
  meetingId: string,
  input: Partial<{
    eventId: string;
    slotId: string;
    studentId: string;
    companyId: string;
  }>
): Promise<BackendMeeting> {
  const body: Record<string, unknown> = {};

  if (input.eventId !== undefined) {
    body.event_id = toNumberId(input.eventId, "event_id");
  }

  if (input.slotId !== undefined) {
    body.slot_id = toNumberId(input.slotId, "slot_id");
  }

  if (input.studentId !== undefined) {
    body.student_id = toNumberId(input.studentId, "student_id");
  }

  if (input.companyId !== undefined) {
    body.company_id = toNumberId(input.companyId, "company_id");
  }

  const data = await apiFetch<BackendMeetingDto>(
    `/api/backend/meetings/${meetingId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );

  return mapBackendMeeting(data);
}

export async function deleteMeeting(meetingId: string) {
  return apiFetch<{ message?: string; status?: string }>(
    `/api/backend/meetings/${meetingId}`,
    {
      method: "DELETE",
    }
  );
}