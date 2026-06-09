import { apiFetch } from "@/lib/apiClient";

export type BackendSlot = {
  id: string;
  startTime: string;
  endTime: string;
  eventId: string;
};

type BackendSlotDto = {
  id?: string | number;
  start_time?: string;
  end_time?: string;
  event_id?: string | number;
};

function mapBackendSlot(dto: BackendSlotDto): BackendSlot {
  return {
    id: String(dto.id ?? ""),
    startTime: dto.start_time ?? "",
    endTime: dto.end_time ?? "",
    eventId: String(dto.event_id ?? ""),
  };
}

export async function getAllSlots(eventId?: string): Promise<BackendSlot[]> {
  const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
  const data = await apiFetch<BackendSlotDto[]>(`/api/backend/slots${query}`);
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendSlot);
}

export async function createSlot(input: {
  startTime: string;
  endTime: string;
  eventId: string;
}): Promise<BackendSlot> {
  const data = await apiFetch<BackendSlotDto>("/api/backend/slots", {
    method: "POST",
    body: JSON.stringify({
      start_time: input.startTime,
      end_time: input.endTime,
      event_id: Number(input.eventId),
    }),
  });

  return mapBackendSlot(data);
}

export async function updateSlot(
  slotId: string,
  input: Partial<{
    startTime: string;
    endTime: string;
  }>
): Promise<BackendSlot> {
  const body: Record<string, unknown> = {};

  if (input.startTime !== undefined) body.start_time = input.startTime;
  if (input.endTime !== undefined) body.end_time = input.endTime;

  const data = await apiFetch<BackendSlotDto>(`/api/backend/slots/${slotId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return mapBackendSlot(data);
}

export async function deleteSlot(slotId: string) {
  return apiFetch<{ message?: string; status?: string }>(
    `/api/backend/slots/${slotId}`,
    {
      method: "DELETE",
    }
  );
}
