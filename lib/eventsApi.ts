import { apiFetch } from "@/lib/apiClient";

export type BackendEvent = {
  id: string;
  name: string;
  location: string;
  description: string;
  eventDate: string;
  isActive: boolean;
};

type BackendEventDto = {
  id?: string | number;
  name?: string;
  location?: string | null;
  description?: string | null;
  event_date?: string;
  is_active?: boolean;
};

function mapBackendEvent(dto: BackendEventDto): BackendEvent {
  return {
    id: String(dto.id ?? ""),
    name: dto.name ?? "",
    location: dto.location ?? "",
    description: dto.description ?? "",
    eventDate: dto.event_date ?? "",
    isActive: Boolean(dto.is_active),
  };
}

export async function getAllEvents(): Promise<BackendEvent[]> {
  const data = await apiFetch<BackendEventDto[]>("/api/backend/events");
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendEvent);
}

export async function getActiveEvents(): Promise<BackendEvent[]> {
  const data = await apiFetch<BackendEventDto | BackendEventDto[]>("/api/backend/active");
  const list = Array.isArray(data) ? data : data ? [data] : [];
  return list.map(mapBackendEvent);
}

export async function createEvent(input: {
  name: string;
  eventDate: string;
  location?: string;
  description?: string;
  isActive?: boolean;
}): Promise<BackendEvent> {
  const data = await apiFetch<BackendEventDto>("/api/backend/events", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      event_date: input.eventDate,
      location: input.location ?? "",
      description: input.description ?? "",
      is_active: input.isActive ?? true,
    }),
  });

  return mapBackendEvent(data);
}

export async function updateEvent(
  eventId: string,
  input: Partial<{
    name: string;
    eventDate: string;
    location: string;
    description: string;
    isActive: boolean;
  }>
): Promise<BackendEvent> {
  const body: Record<string, unknown> = {};

  if (input.name !== undefined) body.name = input.name;
  if (input.eventDate !== undefined) body.event_date = input.eventDate;
  if (input.location !== undefined) body.location = input.location;
  if (input.description !== undefined) body.description = input.description;
  if (input.isActive !== undefined) body.is_active = input.isActive;

  const data = await apiFetch<BackendEventDto>(`/api/backend/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return mapBackendEvent(data);
}

export async function deleteEvent(eventId: string) {
  return apiFetch<{ message?: string; status?: string }>(
    `/api/backend/events/${eventId}`,
    {
      method: "DELETE",
    }
  );
}