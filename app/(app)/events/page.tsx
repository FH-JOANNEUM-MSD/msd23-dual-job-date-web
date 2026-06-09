"use client";

import * as XLSX from "xlsx";
import React, { useEffect, useMemo, useState } from "react";
import { getStudents, Student } from "@/lib/studentsApi";
import { getCompanies, Company } from "@/lib/companiesApi";
import {
  assignMeetings,
  getAllMeetings,
  saveEventMeetings,
  type BackendMeeting,
} from "@/lib/meetingsApi";

import {
  createEvent as createBackendEvent,
  deleteEvent as deleteBackendEvent,
  getAllEvents,
  updateEvent as updateBackendEvent,
  type BackendEvent,
} from "@/lib/eventsApi";

import { createSlot, getAllSlots, type BackendSlot } from "@/lib/slotsApi";
import {
  buildPreferenceMap,
  getAllPreferences,
  preferenceKey,
  type Preference,
} from "@/lib/preferencesApi";

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

function cellKey(companyId: string, slot: string) {
  return `${companyId}::${slot}`;
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
      const eventMeetings = backendMeetings.filter((meeting) => meeting.eventId === event.id);

      const assignments = eventMeetings
        .map((meeting) => {
          const slot = slotById.get(meeting.slotId);
          const company = companyById.get(meeting.companyId);
          const slotStart =
            slot?.startTime?.slice(0, 5) || meeting.slotStartTime?.slice(0, 5) || "";

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
          if (a.companyName !== b.companyName) return a.companyName.localeCompare(b.companyName);
          return a.studentName.localeCompare(b.studentName);
        });

      // Defect-3 fix: derive slots from the event's own slot rows (event-owned),
      // not from meetings — empty slots stay visible and the count is exact.
      const slots = [
        ...new Set(
          backendSlots
            .filter((slot) => slot.eventId === event.id)
            .map((slot) => slot.startTime.slice(0, 5))
            .filter(Boolean)
        ),
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

  // Matrix model: `${companyId}::${slotTime}` -> studentId ("" / absent = empty seat)
  const [cellAssignments, setCellAssignments] = useState<Record<string, string>>({});
  const [matchingInfo, setMatchingInfo] = useState<string | null>(null);

  const [backendMeetings, setBackendMeetings] = useState<BackendMeeting[]>([]);
  const [backendEvents, setBackendEvents] = useState<BackendEvent[]>([]);
  const [backendSlots, setBackendSlots] = useState<BackendSlot[]>([]);
  const [backendScheduleError, setBackendScheduleError] = useState<string | null>(null);

  const [editingBackendEventId, setEditingBackendEventId] = useState<string | null>(null);

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
    return generateSlots(startTime, slotCount, slotDurationMinutes, pauseAfterSlots, pauseMinutes);
  }, [startTime, slotCount, slotDurationMinutes, pauseAfterSlots, pauseMinutes]);

  const backendEventDisplays = useMemo(() => {
    return buildBackendEventDisplays(backendEvents, backendMeetings, backendSlots, companies);
  }, [backendEvents, backendMeetings, backendSlots, companies]);

  const editingBackendEvent = useMemo(() => {
    return backendEventDisplays.find((event) => event.id === editingBackendEventId) ?? null;
  }, [backendEventDisplays, editingBackendEventId]);

  const isEditingEvent = editingBackendEvent !== null;
  const activeSlots = editingBackendEvent ? editingBackendEvent.slots : generatedSlots;
  const prefMap = useMemo(() => buildPreferenceMap(preferences), [preferences]);

  function safeFileName(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
    XLSX.writeFile(workbook, `${safeFileName(event.title)}_${event.date}.xlsx`);
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

  // Match on startTime alone: start times are unique within an event grid and
  // knownSlots is already eventId-scoped. Matching on endTime too would miss
  // existing slots whose stored duration differs from the (default) input,
  // causing duplicate slot rows on edit.
  function sameSlot(slot: BackendSlot, slotStart: string) {
    return slot.startTime.slice(0, 5) === slotStart.slice(0, 5);
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
    setBackendScheduleError(null);

    return { eventsData, meetingsData, slotsData };
  }

  async function ensureBackendSlots(slots: string[], eventId: string) {
    const slotIdByStartTime = new Map<string, string>();
    let knownSlots = backendSlots.filter((slot) => slot.eventId === eventId);

    for (const slot of slots) {
      const startTimeValue = toBackendTime(slot);
      const endTimeValue = addMinutesToTimeString(slot, slotDurationMinutes);

      const existingSlot = knownSlots.find((backendSlot) =>
        sameSlot(backendSlot, startTimeValue)
      );

      if (existingSlot) {
        slotIdByStartTime.set(slot, existingSlot.id);
        continue;
      }

      const createdSlot = await createSlot({ startTime: startTimeValue, endTime: endTimeValue, eventId });
      knownSlots = [...knownSlots, createdSlot];
      slotIdByStartTime.set(slot, createdSlot.id);
    }

    setBackendSlots((prev) => {
      const merged = [...prev];
      for (const slot of knownSlots) {
        if (!merged.some((existing) => existing.id === slot.id)) merged.push(slot);
      }
      return merged;
    });

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
    return { studyProgram: parsedProgram, semester: parsedSemester };
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

    const cells: Record<string, string> = {};
    event.assignments.forEach((assignment) => {
      cells[cellKey(assignment.companyId, assignment.slot)] = assignment.studentId;
    });
    setCellAssignments(cells);

    setMatchingInfo(
      `Termin "${event.title}" wird bearbeitet. Änderungen werden erst durch Speichern übernommen.`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelBackendEventEdit() {
    setEditingBackendEventId(null);
    setCellAssignments({});
    setTitle("");
    setDate("");
    setMatchingInfo(null);
  }

  async function deleteBackendEventDisplay(event: BackendEventDisplay) {
    const ok = confirm(`Termin "${event.title}" wirklich löschen?`);
    if (!ok) return;

    try {
      setError(null);
      // ON DELETE CASCADE removes the event's meetings + slots server-side.
      await deleteBackendEvent(event.id);
      await refreshBackendSchedule();
      if (editingBackendEventId === event.id) cancelBackendEventEdit();
      setMatchingInfo(`Termin "${event.title}" wurde gelöscht.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Termin konnte nicht gelöscht werden.");
    }
  }

  function validateEventMeta(): string | null {
    if (!title.trim()) return "Bitte einen Titel für den Termin eingeben.";
    if (!date) return "Bitte ein Datum auswählen.";
    if (!studyProgram) return "Bitte ein akademisches Programm auswählen.";
    if (activeSlots.length === 0) return "Bitte gültige Zeitslots definieren.";
    return null;
  }

  async function ensureEventSaved(): Promise<string> {
    const description = `Akademisches Programm: ${studyProgram}; Semester: ${
      semester === 0 ? "Alle Semester" : semester
    }`;

    if (editingBackendEvent) {
      const updated = await updateBackendEvent(editingBackendEvent.id, {
        name: title.trim(),
        eventDate: date,
        description,
        isActive: editingBackendEvent.isActive,
        location: editingBackendEvent.location,
      });
      return updated.id;
    }

    const created = await createBackendEvent({
      name: title.trim(),
      eventDate: date,
      location: "",
      description,
      isActive: true,
    });
    setEditingBackendEventId(created.id);
    return created.id;
  }

  function studentConflict(studentId: string, companyId: string, slot: string): string | null {
    if (!studentId) return null;
    for (const [key, assignedStudent] of Object.entries(cellAssignments)) {
      if (assignedStudent !== studentId) continue;
      if (key === cellKey(companyId, slot)) continue;
      const [otherCompanyId, otherSlot] = key.split("::");
      if (otherSlot === slot) return "Studierende/r ist in diesem Zeitslot bereits zugeordnet.";
      if (otherCompanyId === companyId) return "Studierende/r hat dieses Unternehmen bereits in einem anderen Zeitslot.";
    }
    return null;
  }

  function updateCell(companyId: string, slot: string, studentId: string) {
    setError(null);

    if (studentId) {
      const conflict = studentConflict(studentId, companyId, slot);
      if (conflict) {
        setError(conflict);
        return;
      }
      if (prefMap.get(preferenceKey(studentId, companyId)) === "dislike") {
        const company = companies.find((c) => c.id === companyId);
        setError(`Achtung: Studierende/r hat ${company?.name ?? "dieses Unternehmen"} abgelehnt (Dislike).`);
      }
    }

    setCellAssignments((prev) => {
      const next = { ...prev };
      if (studentId) next[cellKey(companyId, slot)] = studentId;
      else delete next[cellKey(companyId, slot)];
      return next;
    });
  }

  function buildDesiredMeetings(slotIdByStartTime: Map<string, string>) {
    const desired: { slotId: string; studentId: string; companyId: string }[] = [];
    for (const company of companies) {
      for (const slot of activeSlots) {
        const studentId = cellAssignments[cellKey(company.id, slot)];
        if (!studentId) continue;
        const slotId = slotIdByStartTime.get(slot);
        if (!slotId) continue;
        desired.push({ slotId, studentId, companyId: company.id });
      }
    }
    return desired;
  }

  async function autoGenerate() {
    const metaError = validateEventMeta();
    if (metaError) {
      setError(metaError);
      return;
    }

    try {
      setError(null);
      const eventId = await ensureEventSaved();
      const slotIdByStartTime = await ensureBackendSlots(activeSlots, eventId);

      const timeBySlotId = new Map<string, string>();
      slotIdByStartTime.forEach((id, time) => timeBySlotId.set(id, time));

      const result = await assignMeetings({
        eventId,
        studentIds: filteredStudents.map((s) => s.id),
        dryRun: true,
        replaceExisting: true,
      });

      const cells: Record<string, string> = {};
      result.plannedMeetings.forEach((meeting) => {
        const slotTime = timeBySlotId.get(meeting.slotId);
        if (slotTime) cells[cellKey(meeting.companyId, slotTime)] = meeting.studentId;
      });
      setCellAssignments(cells);

      const unassigned = result.summary.unassignedCompanySlots;
      setMatchingInfo(
        `${result.plannedMeetings.length} Meetings vorgeschlagen` +
          (unassigned > 0 ? `, ${unassigned} Firmen-Slots ohne Zuteilung.` : ".")
      );

      await refreshBackendSchedule();
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : "Auto-Zuteilung fehlgeschlagen.");
    }
  }

  async function saveSchedule() {
    const metaError = validateEventMeta();
    if (metaError) {
      setError(metaError);
      return;
    }

    try {
      setError(null);
      const eventId = await ensureEventSaved();
      const slotIdByStartTime = await ensureBackendSlots(activeSlots, eventId);
      const desired = buildDesiredMeetings(slotIdByStartTime);

      await saveEventMeetings(eventId, desired);
      await refreshBackendSchedule();

      setTitle("");
      setDate("");
      setEditingBackendEventId(null);
      setCellAssignments({});
      setMatchingInfo(`Zeitplan gespeichert (${desired.length} Meetings).`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Termin konnte nicht gespeichert werden.");
    }
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
        } catch (backendScheduleErr) {
          const message =
            backendScheduleErr instanceof Error
              ? backendScheduleErr.message
              : "Backend-Termine konnten nicht geladen werden.";
          setBackendScheduleError(message);
          console.error("Backend schedule fetch failed:", backendScheduleErr);
        }

        const firstProgram = studentsData.find((s) => s.studyProgram)?.studyProgram ?? "";
        setStudyProgram(firstProgram);
        setSemester(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!studyProgram) return;
    if (semester !== 0 && !semestersForProgram.includes(semester)) setSemester(0);
  }, [studyProgram, semestersForProgram, semester]);

  return (
    <>
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Job Dating Sommersemester" />
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
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Semester</span>
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} disabled={!studyProgram}>
              <option value={0}>Alle Semester</option>
              {semestersForProgram.map((value) => (
                <option key={value} value={value}>Semester {value}</option>
              ))}
            </select>
          </label>

          <label className="field formFull">
            <span>Startzeit</span>
            <input type="time" value={startTime} disabled={isEditingEvent} onChange={(e) => setStartTime(e.target.value)} />
          </label>

          <label className="field">
            <span>Anzahl Slots</span>
            <input type="number" min={1} value={slotCount} disabled={isEditingEvent} onChange={(e) => setSlotCount(Number(e.target.value))} />
          </label>

          <label className="field">
            <span>Dauer pro Slot (Minuten)</span>
            <input type="number" min={5} step={5} value={slotDurationMinutes} disabled={isEditingEvent} onChange={(e) => setSlotDurationMinutes(Number(e.target.value))} />
          </label>

          <label className="field">
            <span>Pause nach Anzahl Slots</span>
            <input type="number" min={0} value={pauseAfterSlots} disabled={isEditingEvent} onChange={(e) => setPauseAfterSlots(Number(e.target.value))} />
          </label>

          <label className="field">
            <span>Pausendauer (Minuten)</span>
            <input type="number" min={0} step={5} value={pauseMinutes} disabled={isEditingEvent} onChange={(e) => setPauseMinutes(Number(e.target.value))} />
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <strong>{isEditingEvent ? "Gespeicherte Slots:" : "Generierte Slots:"}</strong>{" "}
          {activeSlots.length > 0
            ? activeSlots
                .map((slot, index) => {
                  const showPause =
                    !isEditingEvent && pauseAfterSlots > 0 && pauseMinutes > 0 && index > 0 && index % pauseAfterSlots === 0;
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

          <button type="button" className="btn btnGhost" onClick={() => void autoGenerate()}>
            Automatisch zuteilen
          </button>

          <button type="button" className="btn btnPrimary" onClick={() => void saveSchedule()}>
            {isEditingEvent ? "Änderungen speichern" : "Termin speichern"}
          </button>
        </div>
      </div>

      <h3 style={{ margin: "18px 0 6px" }}>Zuweisungen prüfen und anpassen</h3>
      <p className="muted" style={{ margin: "0 0 10px" }}>
        Jede Zelle ist ein Slot eines Unternehmens — wähle den/die zugeteilte/n Studierende/n. Änderungen werden erst durch Speichern übernommen.
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
              <th>Unternehmen</th>
              {activeSlots.map((slot) => (
                <th key={slot}>{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeSlots.length + 1}>Lade Daten…</td>
              </tr>
            ) : companies.length === 0 || activeSlots.length === 0 ? (
              <tr>
                <td colSpan={Math.max(activeSlots.length + 1, 2)}>Keine Unternehmen oder Zeitslots verfügbar.</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  {activeSlots.map((slot) => {
                    const studentId = cellAssignments[cellKey(company.id, slot)] ?? "";
                    const pref = studentId ? (prefMap.get(preferenceKey(studentId, company.id)) ?? "none") : null;
                    return (
                      <td key={slot}>
                        <select
                          className={`tableSelect${pref ? ` tableSelect--${pref}` : ""}`}
                          value={studentId}
                          onChange={(e) => updateCell(company.id, slot, e.target.value)}
                        >
                          <option value="">—</option>
                          {filteredStudents.map((student) => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pageHeader" style={{ marginTop: 18, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Gespeicherte Termine</h3>
      </div>

      {backendScheduleError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>{backendScheduleError}</p>
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
                    background: editingBackendEventId === event.id ? "rgba(46, 125, 50, 0.08)" : undefined,
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
                      <button className="btn btnGhost" onClick={(e) => { e.stopPropagation(); openBackendEventForEdit(event); }}>
                        Bearbeiten
                      </button>
                      <button className="btn btnDanger" onClick={(e) => { e.stopPropagation(); void deleteBackendEventDisplay(event); }}>
                        Löschen
                      </button>
                      <button className="btn btnGhost" onClick={(e) => { e.stopPropagation(); exportBackendEvent(event); }}>
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
