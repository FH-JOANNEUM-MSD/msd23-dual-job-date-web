"use client";

import { useEffect, useMemo, useState } from "react";

export type EventAssignment = {
  studentId: string;
  studentName: string;
  companyId: string;
  companyName: string;
  slot: string;
};

export type JobDatingEvent = {
  id: string;
  title: string;
  date: string;
  studyProgram: string;
  semester: number;
  slotDurationMinutes: number;
  slots: string[];
  assignments: EventAssignment[];
  createdAt: string;
};

const STORAGE_KEY = "job_dating_events_v1";

function readEvents(): JobDatingEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: JobDatingEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useEventsStore() {
  const [events, setEvents] = useState<JobDatingEvent[]>([]);

  useEffect(() => {
    setEvents(readEvents());
  }, []);

  useEffect(() => {
    writeEvents(events);
  }, [events]);

  return useMemo(
    () => ({
      events,
      addEvent(event: JobDatingEvent) {
        setEvents((prev) => [event, ...prev]);
      },
      removeEvent(id: string) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      },
    }),
    [events]
  );
}