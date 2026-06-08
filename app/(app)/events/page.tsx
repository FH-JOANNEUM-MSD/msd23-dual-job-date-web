"use client";

import * as XLSX from "xlsx";
import React, { useEffect, useMemo, useState } from "react";
import { getStudents, Student } from "@/lib/studentsApi";
import { getCompanies, Company } from "@/lib/companiesApi";
import {
  createMeeting,
  deleteMeeting,
  getAllMeetings,
  updateMeeting,
  type BackendMeeting,
} from "@/lib/meetingsApi";

import {
  createEvent as createBackendEvent,
  deleteEvent as deleteBackendEvent,
  getAllEvents,
  updateEvent as updateBackendEvent,
  type BackendEvent,
} from "@/lib/eventsApi";

import {
  createSlot,
  getAllSlots,
  type BackendSlot,
} from "@/lib/slotsApi";
import {
  buildPreferenceMap,
  getAllPreferences,
  preferenceKey,
  type Preference,
  type PreferenceType,
} from "@/lib/preferencesApi";

type AssignmentDraft = {
  companyId: string;
  slot: string;
};

type RankedCandidate = {
  company: Company;
  pref: Exclude<PreferenceType, "dislike">;
  score: number;
  currentLoad: number;
  slot: string;
};

type BackendEventDisplay = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  isActive: boolean;
  slots: string[];
  assignments: {
    meetingId: string;
    slotId: string;
    studentId: string;
    studentName: string;
    companyId: string;
    companyName: string;
    slot: string;
  }[];
};

type EventAssignment = {
  studentId: string;
  studentName: string;
  companyId: string;
  companyName: string;
  slot: string;
};

function generateSlots(
  startTime: string,
  count: number,
  durationMinutes: number,
  pauseAfterSlots: number,
  pauseMinutes: number
): string[] {
  if (!startTime || count <= 0 || durationMinutes <= 0) return [];

  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return [];

  const baseMinutes = h * 60 + m;

  return Array.from({ length: count }, (_, i) => {
    const pauseCount = pauseAfterSlots > 0 ? Math.floor(i / pauseAfterSlots) : 0;
    const total = baseMinutes + i * durationMinutes + pauseCount * pauseMinutes;
    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  });
}

function preferenceScore(type: PreferenceType): number {
  if (type === "like") return 2;
  if (type === "none") return 1;
  return -9999;
}

function generateAutomaticAssignments(
  students: Student[],
  companies: Company[],
  slots: string[],
  preferences: Preference[]
): Record<string, AssignmentDraft> {
  if (students.length === 0 || companies.length === 0 || slots.length === 0) {
    return {};
  }

  const prefMap = new Map<string, PreferenceType>();
  preferences.forEach((pref) => {
    prefMap.set(preferenceKey(pref.studentId, pref.companyId), pref.preferenceType);
  });

  const companyLoads = new Map<string, number>();
  companies.forEach((company) => {
    companyLoads.set(company.id, 0);
  });

  const usedSeats = new Set<string>();
  const result: Record<string, AssignmentDraft> = {};

  const orderedStudents = [...students]
    .map((student) => {
      const allowedCompanies = companies.filter((company) => {
        const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "none";
        return pref !== "dislike";
      });

      const likeCount = companies.filter((company) => {
        const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "none";
        return pref === "like";
      }).length;

      return {
        student,
        allowedCount: allowedCompanies.length,
        likeCount,
      };
    })
    .sort((a, b) => {
      if (a.allowedCount !== b.allowedCount) return a.allowedCount - b.allowedCount;
      if (a.likeCount !== b.likeCount) return a.likeCount - b.likeCount;
      return a.student.name.localeCompare(b.student.name);
    });

  let slotCursor = 0;

  function findNextSlotForCompany(companyId: string): string | null {
    for (let offset = 0; offset < slots.length; offset++) {
      const slot = slots[(slotCursor + offset) % slots.length];

      if (!usedSeats.has(`${companyId}::${slot}`)) {
        return slot;
      }
    }

    return null;
  }

  for (const entry of orderedStudents) {
    const { student } = entry;

    const rankedCandidates = companies
      .map((company) => {
        const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "none";

        if (pref === "dislike") {
          return null;
        }

        const nextFreeSlot = findNextSlotForCompany(company.id);

        if (!nextFreeSlot) {
          return null;
        }

        return {
          company,
          pref,
          score: preferenceScore(pref),
          currentLoad: companyLoads.get(company.id) ?? 0,
          slot: nextFreeSlot,
        };
      })
      .filter((candidate): candidate is RankedCandidate => candidate !== null)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad;
        if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
        return a.company.name.localeCompare(b.company.name);
      });

    const chosen = rankedCandidates[0];
    if (!chosen) {
      continue;
    }

    result[student.id] = {
      companyId: chosen.company.id,
      slot: chosen.slot,
    };

    usedSeats.add(`${chosen.company.id}::${chosen.slot}`);
    slotCursor = (slots.indexOf(chosen.slot) + 1) % slots.length;
    companyLoads.set(chosen.company.id, chosen.currentLoad + 1);
  }

  return result;
}

function buildBackendEventDisplays(
  backendEvents: BackendEvent[],
  backendMeetings: BackendMeeting[],
  backendSlots: BackendSlot[],
  companies: Company[]
): BackendEventDisplay[] {
  const slotById = new Map(backendSlots.map((slot) => [slot.id, slot]));
  const companyById = new Map(companies.map((company) => [company.id, company]));

  return backendEvents
    .map((event) => {
      const eventMeetings = backendMeetings.filter(
        (meeting) => meeting.eventId === event.id
      );

      const assignments = eventMeetings
        .map((meeting) => {
          const slot = slotById.get(meeting.slotId);
          const company = companyById.get(meeting.companyId);

          const slotStart =
            slot?.startTime?.slice(0, 5) ||
            meeting.slotStartTime?.slice(0, 5) ||
            "";

          return {
            meetingId: meeting.id,
            slotId: meeting.slotId,
            studentId: meeting.studentId,
            studentName: meeting.studentName,
            companyId: meeting.companyId,
            companyName: company?.name || `Unternehmen ${meeting.companyId}`,
            slot: slotStart,
          };
        })
        .sort((a, b) => {
          if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
          if (a.companyName !== b.companyName) {
            return a.companyName.localeCompare(b.companyName);
          }
          return a.studentName.localeCompare(b.studentName);
        });

      const slots = [
        ...new Set(assignments.map((assignment) => assignment.slot).filter(Boolean)),
      ].sort();

      return {
        id: event.id,
        title: event.name,
        date: event.eventDate,
        location: event.location,
        description: event.description,
        isActive: event.isActive,
        slots,
        assignments,
      };
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.title.localeCompare(b.title);
    });
}

export default function EventsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [semester, setSemester] = useState<number>(0);
  const [startTime, setStartTime] = useState("09:00");
  const [slotCount, setSlotCount] = useState(6);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);
  const [pauseAfterSlots, setPauseAfterSlots] = useState(3);
  const [pauseMinutes, setPauseMinutes] = useState(15);

  const [assignments, setAssignments] = useState<Record<string, AssignmentDraft>>({});
  const [matchingInfo, setMatchingInfo] = useState<string | null>(null);

  const [backendMeetings, setBackendMeetings] = useState<BackendMeeting[]>([]);
  const [backendMeetingsError, setBackendMeetingsError] = useState<string | null>(null);
  const [backendEvents, setBackendEvents] = useState<BackendEvent[]>([]);
  const [backendSlots, setBackendSlots] = useState<BackendSlot[]>([]);
  const [backendScheduleError, setBackendScheduleError] = useState<string | null>(null);

  const [editingBackendEventId, setEditingBackendEventId] = useState<string | null>(null);

  function timeToMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function minutesToTime(total: number) {
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  function isCompanySlotTakenInAssignments(
    currentAssignments: Record<string, AssignmentDraft>,
    currentStudentId: string,
    companyId: string,
    slot: string
  ) {
    if (!companyId || !slot) return false;

    return Object.entries(currentAssignments).some(([studentId, draft]) => {
      return (
        studentId !== currentStudentId &&
        draft.companyId === companyId &&
        draft.slot === slot
      );
    });
  }

  function isCompanySlotTaken(currentStudentId: string, companyId: string, slot: string) {
    return isCompanySlotTakenInAssignments(assignments, currentStudentId, companyId, slot);
  }


  function safeFileName(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
  }

  function exportBackendEvent(event: BackendEventDisplay) {
    const rows = event.assignments.map((assignment) => ({
      Titel: event.title,
      Datum: event.date,
      Ort: event.location,
      Uhrzeit: assignment.slot,
      Unternehmen: assignment.companyName,
      Studierende: assignment.studentName,
    }));

    if (rows.length === 0) {
      setError("Für diesen Termin gibt es keine Zuweisungen für den Export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Termine");

    const fileName = `${safeFileName(event.title)}_${event.date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [studentsData, companiesData, preferencesData] = await Promise.all([
          getStudents(),
          getCompanies(),
          getAllPreferences(),
        ]);

        setStudents(studentsData);
        setCompanies(companiesData);
        setPreferences(preferencesData);

    try {
      await refreshBackendSchedule();
    } catch (backendScheduleError) {
      const message =
        backendScheduleError instanceof Error
          ? backendScheduleError.message
          : "Backend-Termine konnten nicht geladen werden.";

      setBackendScheduleError(message);
      setBackendMeetingsError(message);
      console.error("Backend schedule fetch failed:", backendScheduleError);
    }

            const firstProgram = studentsData.find((s) => s.studyProgram)?.studyProgram ?? "";
            setStudyProgram(firstProgram);
            setSemester(0);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Daten konnten nicht geladen werden.";
            setError(message);
          } finally {
            setLoading(false);
          }
        }

        void load();
      }, []);

  const studyPrograms = useMemo(() => {
    return [...new Set(students.map((s) => s.studyProgram).filter(Boolean))].sort();
  }, [students]);

  const semestersForProgram = useMemo(() => {
    return [
      ...new Set(
        students
          .filter((s) => s.studyProgram === studyProgram && s.semester !== null)
          .map((s) => s.semester as number)
      ),
    ].sort((a, b) => a - b);
  }, [students, studyProgram]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesProgram = s.studyProgram === studyProgram;
      const matchesSemester = semester === 0 || s.semester === semester;

      return matchesProgram && matchesSemester;
    });
  }, [students, studyProgram, semester]);

const generatedSlots = useMemo(() => {
  return generateSlots(
    startTime,
    slotCount,
    slotDurationMinutes,
    pauseAfterSlots,
    pauseMinutes
  );
}, [startTime, slotCount, slotDurationMinutes, pauseAfterSlots, pauseMinutes]);

const backendEventDisplays = useMemo(() => {
  return buildBackendEventDisplays(
    backendEvents,
    backendMeetings,
    backendSlots,
    companies
  );
}, [backendEvents, backendMeetings, backendSlots, companies]);

const editingBackendEvent = useMemo(() => {
  return backendEventDisplays.find((event) => event.id === editingBackendEventId) ?? null;
}, [backendEventDisplays, editingBackendEventId]);

const isEditingEvent = editingBackendEvent !== null;

const activeSlots = editingBackendEvent ? editingBackendEvent.slots : generatedSlots;

useEffect(() => {
  if (!studyProgram) return;

  if (semester !== 0 && !semestersForProgram.includes(semester)) {
    setSemester(0);
  }
}, [studyProgram, semestersForProgram, semester]);

const prefMap = useMemo(() => buildPreferenceMap(preferences), [preferences]);

const autoAssignments = useMemo(() => {
  return generateAutomaticAssignments(filteredStudents, companies, activeSlots, preferences);
}, [filteredStudents, companies, activeSlots, preferences]);

  useEffect(() => {
    if (isEditingEvent) return;

    setAssignments(autoAssignments);

    const matchedCount = Object.keys(autoAssignments).length;
    const unmatchedCount = filteredStudents.length - matchedCount;

    if (filteredStudents.length > 0) {
      setMatchingInfo(
        `${matchedCount} Studierende automatisch zugewiesen, ${unmatchedCount} ohne Zuweisung.`
      );
    } else {
      setMatchingInfo(null);
    }
  }, [autoAssignments, filteredStudents, isEditingEvent]);

  const assignmentRows = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const slotA = assignments[a.id]?.slot ?? "99:99";
      const slotB = assignments[b.id]?.slot ?? "99:99";

      if (slotA !== slotB) {
        return slotA.localeCompare(slotB);
      }

      const companyA =
        companies.find((company) => company.id === assignments[a.id]?.companyId)?.name ?? "";
      const companyB =
        companies.find((company) => company.id === assignments[b.id]?.companyId)?.name ?? "";

      if (companyA !== companyB) {
        return companyA.localeCompare(companyB);
      }

      return a.name.localeCompare(b.name);
    });
  }, [filteredStudents, assignments, companies]);

  function updateAssignment(student: Student, patch: Partial<AssignmentDraft>) {
    setError(null);

    setAssignments((prev) => {
      const currentDraft = prev[student.id] ?? { companyId: "", slot: "" };

      const nextDraft: AssignmentDraft = {
        companyId: patch.companyId ?? currentDraft.companyId,
        slot: patch.slot ?? currentDraft.slot,
      };

      if (
        nextDraft.companyId &&
        nextDraft.slot &&
        isCompanySlotTakenInAssignments(
          prev,
          student.id,
          nextDraft.companyId,
          nextDraft.slot
        )
      ) {
        const companyName =
          companies.find((company) => company.id === nextDraft.companyId)?.name ?? "Dieses Unternehmen";

        setError(
          `${companyName} ist um ${nextDraft.slot} bereits einem anderen Studierenden zugeordnet.`
        );

        return prev;
      }

      return {
        ...prev,
        [student.id]: nextDraft,
      };
    });
  }

  function buildAssignmentsFromDrafts(): EventAssignment[] {
    return filteredStudents
      .map((student) => {
        const draft = assignments[student.id];
        if (!draft?.companyId || !draft?.slot) return null;

        const company = companies.find((c) => c.id === draft.companyId);
        if (!company) return null;

        return {
          studentId: student.id,
          studentName: student.name,
          companyId: company.id,
          companyName: company.name,
          slot: draft.slot,
        };
      })
      .filter((assignment): assignment is EventAssignment => assignment !== null);
  }

  function validateAssignments(eventAssignments: EventAssignment[]): string | null {
    const studentSlotMap = new Map<string, string>();
    const companySlotMap = new Map<string, string>();

    for (const assignment of eventAssignments) {
      const studentSlotKey = `${assignment.studentId}::${assignment.slot}`;
      const companySlotKey = `${assignment.companyId}::${assignment.slot}`;

      if (studentSlotMap.has(studentSlotKey)) {
        return `Ungültige Zuordnung: ${assignment.studentName} ist um ${assignment.slot} bereits einem anderen Unternehmen zugeordnet.`;
      }

      if (companySlotMap.has(companySlotKey)) {
        return `Ungültige Zuordnung: ${assignment.companyName} ist um ${assignment.slot} bereits einem anderen Studierenden zugeordnet.`;
      }

      const preference =
        prefMap.get(preferenceKey(assignment.studentId, assignment.companyId)) ?? "none";

      if (preference === "dislike") {
        return `Ungültige Zuordnung: ${assignment.studentName} hat ${assignment.companyName} abgelehnt.`;
      }

      studentSlotMap.set(studentSlotKey, assignment.companyName);
      companySlotMap.set(companySlotKey, assignment.studentName);
    }

    return null;
  }

  function toBackendTime(time: string) {
  if (!time) return "";
  return time.length === 5 ? `${time}:00` : time;
}

function addMinutesToTimeString(time: string, minutesToAdd: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;

  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");

  return `${hh}:${mm}:00`;
}

function sameSlot(slot: BackendSlot, startTime: string, endTime: string) {
  return (
    slot.startTime.slice(0, 5) === startTime.slice(0, 5) &&
    slot.endTime.slice(0, 5) === endTime.slice(0, 5)
  );
}

async function refreshBackendSchedule() {
  const [eventsData, meetingsData, slotsData] = await Promise.all([
    getAllEvents(),
    getAllMeetings(),
    getAllSlots(),
  ]);

  setBackendEvents(eventsData);
  setBackendMeetings(meetingsData);
  setBackendSlots(slotsData);
  setBackendMeetingsError(null);
  setBackendScheduleError(null);

  return {
    eventsData,
    meetingsData,
    slotsData,
  };
}

async function ensureBackendSlots(slots: string[]) {
  const slotIdByStartTime = new Map<string, string>();
  let knownSlots = [...backendSlots];

  for (const slot of slots) {
    const startTime = toBackendTime(slot);
    const endTime = addMinutesToTimeString(slot, slotDurationMinutes);

    const existingSlot = knownSlots.find((backendSlot) =>
      sameSlot(backendSlot, startTime, endTime)
    );

    if (existingSlot) {
      slotIdByStartTime.set(slot, existingSlot.id);
      continue;
    }

    const createdSlot = await createSlot({
      startTime,
      endTime,
    });

    knownSlots = [...knownSlots, createdSlot];
    slotIdByStartTime.set(slot, createdSlot.id);
  }

  setBackendSlots(knownSlots);
  return slotIdByStartTime;
}

function parseEventMeta(description: string) {
  const programMatch = description.match(/Akademisches Programm:\s*([^;]+)/i);
  const semesterMatch = description.match(/Semester:\s*([^;]+)/i);

  const parsedProgram = programMatch?.[1]?.trim() ?? "";
  const semesterText = semesterMatch?.[1]?.trim() ?? "";

  const parsedSemester =
    semesterText.toLowerCase() === "alle semester"
      ? 0
      : Number.isFinite(Number(semesterText))
        ? Number(semesterText)
        : 0;

  return {
    studyProgram: parsedProgram,
    semester: parsedSemester,
  };
}

function openBackendEventForEdit(event: BackendEventDisplay) {
  setError(null);
  setEditingBackendEventId(event.id);

  setTitle(event.title);
  setDate(event.date);

  const meta = parseEventMeta(event.description);

  const firstAssignedStudent = students.find((student) =>
    event.assignments.some((assignment) => assignment.studentId === student.id)
  );

  setStudyProgram(meta.studyProgram || firstAssignedStudent?.studyProgram || studyProgram);
  setSemester(meta.semester || 0);

  const eventAssignments: Record<string, AssignmentDraft> = {};

  event.assignments.forEach((assignment) => {
    eventAssignments[assignment.studentId] = {
      companyId: assignment.companyId,
      slot: assignment.slot,
    };
  });

  setAssignments(eventAssignments);
  setMatchingInfo(
    `Termin "${event.title}" wird bearbeitet. Änderungen werden erst durch Speichern übernommen.`
  );

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelBackendEventEdit() {
  setEditingBackendEventId(null);
  setAssignments(autoAssignments);
  setTitle("");
  setDate("");

  const matchedCount = Object.keys(autoAssignments).length;
  const unmatchedCount = filteredStudents.length - matchedCount;

  setMatchingInfo(
    filteredStudents.length > 0
      ? `${matchedCount} Studierende automatisch zugewiesen, ${unmatchedCount} ohne Zuweisung.`
      : null
  );
}

async function deleteBackendEventDisplay(event: BackendEventDisplay) {
  const ok = confirm(`Termin "${event.title}" wirklich löschen?`);
  if (!ok) return;

  try {
    setError(null);

    await Promise.all(
      event.assignments.map((assignment) => deleteMeeting(assignment.meetingId))
    );

    await deleteBackendEvent(event.id);
    await refreshBackendSchedule();

    if (editingBackendEventId === event.id) {
      cancelBackendEventEdit();
    }

    setMatchingInfo(`Termin "${event.title}" wurde gelöscht.`);
  } catch (deleteError) {
    const message =
      deleteError instanceof Error
        ? deleteError.message
        : "Termin konnte nicht gelöscht werden.";

    setError(message);
  }
}

async function saveEvent() {
  if (!title.trim()) {
    setError("Bitte einen Titel für den Termin eingeben.");
    return;
  }

  if (!date) {
    setError("Bitte ein Datum auswählen.");
    return;
  }

  if (!studyProgram) {
    setError("Bitte ein akademisches Programm auswählen.");
    return;
  }

  if (activeSlots.length === 0) {
    setError("Bitte gültige Zeitslots definieren.");
    return;
  }

  const builtAssignments = buildAssignmentsFromDrafts();

  if (builtAssignments.length === 0) {
    setError("Es konnte kein gültiges Matching erzeugt werden.");
    return;
  }

  const validationError = validateAssignments(builtAssignments);
  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setError(null);

    const description = `Akademisches Programm: ${studyProgram}; Semester: ${
      semester === 0 ? "Alle Semester" : semester
    }`;

    const targetEvent = editingBackendEvent
      ? await updateBackendEvent(editingBackendEvent.id, {
          name: title.trim(),
          eventDate: date,
          description,
          isActive: editingBackendEvent.isActive,
          location: editingBackendEvent.location,
        })
      : await createBackendEvent({
          name: title.trim(),
          eventDate: date,
          location: "",
          description,
          isActive: true,
        });

    const slotIdByStartTime = await ensureBackendSlots(activeSlots);

    const existingAssignmentsByStudentId = new Map(
      editingBackendEvent?.assignments.map((assignment) => [
        assignment.studentId,
        assignment,
      ]) ?? []
    );

    const nextAssignmentsByStudentId = new Map(
      builtAssignments.map((assignment) => [assignment.studentId, assignment])
    );

    for (const assignment of builtAssignments) {
      const slotId = slotIdByStartTime.get(assignment.slot);

      if (!slotId) {
        throw new Error(`Kein Backend-Slot für ${assignment.slot} gefunden.`);
      }

      const existingAssignment = existingAssignmentsByStudentId.get(assignment.studentId);

      if (existingAssignment) {
        const changed =
          existingAssignment.companyId !== assignment.companyId ||
          existingAssignment.slotId !== slotId;

        if (changed) {
          await updateMeeting(existingAssignment.meetingId, {
            eventId: targetEvent.id,
            slotId,
            studentId: assignment.studentId,
            companyId: assignment.companyId,
          });
        }
      } else {
        await createMeeting({
          eventId: targetEvent.id,
          slotId,
          studentId: assignment.studentId,
          companyId: assignment.companyId,
        });
      }
    }

    if (editingBackendEvent) {
      const removedAssignments = editingBackendEvent.assignments.filter(
        (assignment) => !nextAssignmentsByStudentId.has(assignment.studentId)
      );

      await Promise.all(
        removedAssignments.map((assignment) => deleteMeeting(assignment.meetingId))
      );
    }

    await refreshBackendSchedule();

    setTitle("");
    setDate("");
    setEditingBackendEventId(null);
    setMatchingInfo(`Termin "${targetEvent.name}" wurde im Backend gespeichert.`);
  } catch (saveError) {
    const message =
      saveError instanceof Error
        ? saveError.message
        : "Termin konnte nicht im Backend gespeichert werden.";

    setError(message);
  }
}

  return (<>
      <div className="pageHeader">
        <div>
          <h2 style={{ margin: 0 }}>Termine</h2>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Job-Dating-Events erstellen und Studierende automatisch oder manuell Unternehmen zuweisen.
          </p>
        </div>
      </div>

      <div className="formCard" style={{ marginBottom: 16 }}>
        <div className="formGrid">
          <label className="field">
            <span>Titel</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Job Dating Sommersemester"
            />
          </label>

          <label className="field">
            <span>Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="field">
            <span>Akademisches Programm</span>
            <select value={studyProgram} onChange={(e) => setStudyProgram(e.target.value)}>
              <option value="">Bitte wählen</option>
              {studyPrograms.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Semester</span>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              disabled={!studyProgram}
            >
              <option value={0}>Alle Semester</option>

              {semestersForProgram.map((value) => (
                <option key={value} value={value}>
                  Semester {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field formFull">
            <span>Startzeit</span>
            <input
              type="time"
              value={startTime}
              disabled={isEditingEvent}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Anzahl Slots</span>
            <input
              type="number"
              min={1}
              value={slotCount}
              disabled={isEditingEvent}
              onChange={(e) => setSlotCount(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Dauer pro Slot (Minuten)</span>
            <input
              type="number"
              min={5}
              step={5}
              value={slotDurationMinutes}
              disabled={isEditingEvent}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Pause nach Anzahl Slots</span>
            <input
              type="number"
              min={0}
              value={pauseAfterSlots}
              disabled={isEditingEvent}
              onChange={(e) => setPauseAfterSlots(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Pausendauer (Minuten)</span>
            <input
              type="number"
              min={0}
              step={5}
              value={pauseMinutes}
              disabled={isEditingEvent}
              onChange={(e) => setPauseMinutes(Number(e.target.value))}
            />
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <strong>{isEditingEvent ? "Gespeicherte Slots:" : "Generierte Slots:"}</strong>{" "}
          {activeSlots.length > 0
            ? activeSlots
                .map((slot, index) => {
                  const showPause =
                    !isEditingEvent &&
                    pauseAfterSlots > 0 &&
                    pauseMinutes > 0 &&
                    index > 0 &&
                    index % pauseAfterSlots === 0;

                  return `${showPause ? `Pause ${pauseMinutes} Min., ` : ""}${slot}`;
                })
                .join(", ")
            : "Keine"}
        </div>

        {matchingInfo && (
          <div style={{ marginTop: 10 }}>
            <strong>Matching:</strong> {matchingInfo}
          </div>
        )}

        {error && <p className="error">{error}</p>}

          <div className="formFooter">
            {isEditingEvent && (
              <button type="button" className="btn btnGhost" onClick={cancelBackendEventEdit}>
                Bearbeitung abbrechen
              </button>
            )}

            <button type="button" className="btn btnPrimary" onClick={() => void saveEvent()}>
              {isEditingEvent ? "Änderungen speichern" : "Termin speichern"}
            </button>
          </div>
        </div>

      <h3 style={{ margin: "18px 0 6px" }}>Zuweisungen prüfen und anpassen</h3>

      <p className="muted" style={{ margin: "0 0 10px" }}>
        Änderungen an Unternehmen und Zeitslots werden erst durch Speichern übernommen.
      </p>

      <div className="prefLegend" style={{ marginBottom: 12 }}>
        <span className="prefCell prefCell--like">↑ Like</span>
        <span className="prefCell prefCell--dislike">↓ Dislike</span>
        <span className="prefCell prefCell--none">— Offen</span>
      </div>

      <div className="tableWrap" style={{ marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Programm</th>
              <th>Unternehmen</th>
              <th>Zeitslot</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Lade Daten…</td>
              </tr>
            ) : assignmentRows.length === 0 ? (
              <tr>
                <td colSpan={4}>Keine Studierende für diese Auswahl gefunden.</td>
              </tr>
            ) : (
              assignmentRows.map((student) => {
                const selectedCompanyId = assignments[student.id]?.companyId ?? "";
                const selectedSlot = assignments[student.id]?.slot ?? "";
                const selectedPref = selectedCompanyId
                  ? (prefMap.get(preferenceKey(student.id, selectedCompanyId)) ?? "none")
                  : null;

                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.studyProgram}</td>
                    <td>
                      <select
                        className={`tableSelect${selectedPref ? ` tableSelect--${selectedPref}` : ""}`}
                        value={selectedCompanyId}
                        title={
                          selectedPref === "like"
                            ? "Studierende/r hat dieses Unternehmen geliked"
                            : selectedPref === "dislike"
                              ? "Studierende/r hat dieses Unternehmen disliked"
                              : selectedPref === "none"
                                ? "Keine Präferenz angegeben"
                                : undefined
                        }
                        onChange={(e) =>
                          updateAssignment(student, { companyId: e.target.value })
                        }
                      >
                        <option value="">Keine Zuordnung</option>
                        {companies.map((company) => {
                          const isTaken = selectedSlot
                            ? isCompanySlotTaken(student.id, company.id, selectedSlot)
                            : false;
                          const pref =
                            prefMap.get(preferenceKey(student.id, company.id)) ?? "none";
                          const prefPrefix =
                            pref === "like" ? "↑ " : pref === "dislike" ? "↓ " : "— ";

                          return (
                            <option key={company.id} value={company.id} disabled={isTaken}>
                              {prefPrefix}
                              {company.name}
                              {isTaken ? " (belegt)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      <select
                        className="tableSelect"
                        value={selectedSlot}
                        onChange={(e) =>
                          updateAssignment(student, { slot: e.target.value })
                        }
                      >
                        <option value="">Keine Zuordnung</option>
                        {activeSlots.map((slot) => {
                          const isTaken = selectedCompanyId
                            ? isCompanySlotTaken(student.id, selectedCompanyId, slot)
                            : false;

                          return (
                            <option key={slot} value={slot} disabled={isTaken}>
                              {slot}
                              {isTaken ? " (belegt)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pageHeader" style={{ marginTop: 18, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Gespeicherte Termine</h3>
      </div>

      {backendScheduleError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>
            {backendScheduleError}
          </p>
        </div>
      )}

      <div className="tableWrap" style={{ marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Datum</th>
              <th>Ort</th>
              <th>Status</th>
              <th>Slots</th>
              <th>Meetings</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {backendEventDisplays.length === 0 ? (
              <tr>
                <td colSpan={7}>Keine gespeicherten Termine geladen.</td>
              </tr>
            ) : (
                  backendEventDisplays.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => openBackendEventForEdit(event)}
                      style={{
                        cursor: "pointer",
                        background:
                          editingBackendEventId === event.id ? "rgba(46, 125, 50, 0.08)" : undefined,
                      }}
                    >
                      <td>{event.title}</td>
                      <td>{event.date}</td>
                      <td>{event.location || <span className="muted">—</span>}</td>
                      <td>
                        <span className={`pill ${event.isActive ? "pillActive" : "pillInactive"}`}>
                          {event.isActive ? "Aktiv" : "Inaktiv"}
                        </span>
                      </td>
                      <td>{event.slots.length}</td>
                      <td>{event.assignments.length}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btnGhost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBackendEventForEdit(event);
                            }}
                          >
                            Bearbeiten
                          </button>

                          <button
                            className="btn btnDanger"
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteBackendEventDisplay(event);
                            }}
                          >
                            Löschen
                          </button>

                          <button
                            className="btn btnGhost"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportBackendEvent(event);
                            }}
                          >
                            Excel exportieren
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}