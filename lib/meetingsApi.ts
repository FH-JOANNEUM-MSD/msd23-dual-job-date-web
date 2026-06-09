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

export async function getMeetingsForCompany(companyId: string): Promise<BackendMeeting[]> {
  const data = await apiFetch<BackendMeetingDto[]>(`/api/backend/companies/${companyId}/meetings`);
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendMeeting);
}

export type PlannedMeeting = {
  slotId: string;
  studentId: string;
  companyId: string;
  preferenceType: string;
};

export type MeetingAssignmentResult = {
  dryRun: boolean;
  plannedMeetings: PlannedMeeting[];
  insertedMeetings: number;
  summary: {
    totalCompanySlots: number;
    generatedMeetings: number;
    assignedLike: number;
    assignedNeutral: number;
    assignedDislike: number;
    dislikeAvoidedSlots: number;
    unassignedCompanySlots: number;
  };
};

type PlannedMeetingDto = {
  slot_id?: string | number;
  student_id?: string | number;
  company_id?: string | number;
  preference_type?: string;
};

type AssignmentResultDto = {
  dry_run?: boolean;
  planned_meetings?: PlannedMeetingDto[];
  inserted_meetings?: number;
  summary?: {
    total_company_slots?: number;
    generated_meetings?: number;
    assigned_like?: number;
    assigned_neutral?: number;
    assigned_dislike?: number;
    dislike_avoided_slots?: number;
    unassigned_company_slots?: number;
  };
};

function mapAssignmentResult(dto: AssignmentResultDto): MeetingAssignmentResult {
  const planned = Array.isArray(dto.planned_meetings) ? dto.planned_meetings : [];
  const summary = dto.summary ?? {};

  return {
    dryRun: Boolean(dto.dry_run),
    plannedMeetings: planned.map((p) => ({
      slotId: String(p.slot_id ?? ""),
      studentId: String(p.student_id ?? ""),
      companyId: String(p.company_id ?? ""),
      preferenceType: String(p.preference_type ?? ""),
    })),
    insertedMeetings: Number(dto.inserted_meetings ?? 0),
    summary: {
      totalCompanySlots: Number(summary.total_company_slots ?? 0),
      generatedMeetings: Number(summary.generated_meetings ?? 0),
      assignedLike: Number(summary.assigned_like ?? 0),
      assignedNeutral: Number(summary.assigned_neutral ?? 0),
      assignedDislike: Number(summary.assigned_dislike ?? 0),
      dislikeAvoidedSlots: Number(summary.dislike_avoided_slots ?? 0),
      unassignedCompanySlots: Number(summary.unassigned_company_slots ?? 0),
    },
  };
}

export async function assignMeetings(input: {
  eventId: string;
  slotIds?: string[];
  studentIds?: string[];
  dryRun?: boolean;
  replaceExisting?: boolean;
  includeInactiveCompanies?: boolean;
}): Promise<MeetingAssignmentResult> {
  const data = await apiFetch<AssignmentResultDto>("/api/backend/meetings/assign", {
    method: "POST",
    body: JSON.stringify({
      event_id: Number(input.eventId),
      slot_ids: input.slotIds?.map(Number),
      student_ids: input.studentIds?.map(Number),
      dry_run: input.dryRun ?? false,
      replace_existing: input.replaceExisting ?? false,
      include_inactive_companies: input.includeInactiveCompanies ?? false,
    }),
  });

  return mapAssignmentResult(data);
}

export async function saveEventMeetings(
  eventId: string,
  meetings: { slotId: string; studentId: string; companyId: string }[]
): Promise<BackendMeeting[]> {
  const data = await apiFetch<BackendMeetingDto[]>(
    `/api/backend/events/${eventId}/meetings`,
    {
      method: "PUT",
      body: JSON.stringify({
        meetings: meetings.map((m) => ({
          slot_id: Number(m.slotId),
          student_id: Number(m.studentId),
          company_id: Number(m.companyId),
        })),
      }),
    }
  );

  if (!Array.isArray(data)) return [];
  return data.map(mapBackendMeeting);
}