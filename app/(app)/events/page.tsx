"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getStudents, Student } from "@/lib/studentsApi";
import { getCompanies, Company } from "@/lib/companiesApi";
import { JobDatingEvent, useEventsStore } from "@/lib/eventsStore";
import { loadSeedPreferences } from "@/lib/testData/localPreferenceSeed";
import type { Preference, PreferenceType } from "@/lib/testData/testPreferences";

type AssignmentDraft = {
  companyId: string;
  slot: string;
};

function generateSlots(startTime: string, count: number, durationMinutes: number): string[] {
  if (!startTime || count <= 0 || durationMinutes <= 0) return [];

  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return [];

  const baseMinutes = h * 60 + m;
  return Array.from({ length: count }, (_, i) => {
    const total = baseMinutes + i * durationMinutes;
    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  });
}

function preferenceKey(studentId: string, companyId: string) {
  return `${studentId}::${companyId}`;
}

function preferenceScore(type: PreferenceType): number {
  if (type === "like") return 2;
  if (type === "neutral") return 1;
  return -9999; // dislike should never be assigned
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
    prefMap.set(preferenceKey(pref.student_id, pref.company_id), pref.preference_type);
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
        const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "neutral";
        return pref !== "dislike";
      });

      const likeCount = companies.filter((company) => {
        const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "neutral";
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

  for (const entry of orderedStudents) {
    const { student } = entry;

    const rankedCandidates = companies
  .map((company) => {
    const pref = prefMap.get(preferenceKey(student.id, company.id)) ?? "neutral";

    if (pref === "dislike") {
      return null;
    }

    const nextFreeSlot = slots.find(
      (slot) => !usedSeats.has(`${company.id}::${slot}`)
    );

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
  .filter(
    (
      candidate
    ): candidate is {
      company: Company;
      pref: "like" | "neutral";
      score: number;
      currentLoad: number;
      slot: string;
    } => candidate !== null
  )
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad;
    if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
    return a.company.name.localeCompare(b.company.name);
  });

    const chosen = rankedCandidates[0];
    if (!chosen) {
      continue; // acceptable that a student remains unmatched
    }

    result[student.id] = {
      companyId: chosen.company.id,
      slot: chosen.slot,
    };

    usedSeats.add(`${chosen.company.id}::${chosen.slot}`);
    companyLoads.set(chosen.company.id, chosen.currentLoad + 1);
  }

  return result;
}

export default function EventsPage() {
  const { events, addEvent, removeEvent } = useEventsStore();

  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [semester, setSemester] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [slotCount, setSlotCount] = useState(6);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);

  const [assignments, setAssignments] = useState<Record<string, AssignmentDraft>>({});
  const [matchingInfo, setMatchingInfo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [studentsData, companiesData] = await Promise.all([
          getStudents(),
          getCompanies(),
        ]);

        setStudents(studentsData);
        setCompanies(companiesData);
        setPreferences(loadSeedPreferences());

        const firstProgram = studentsData.find((s) => s.studyProgram)?.studyProgram ?? "";
        const firstSemester =
          studentsData.find((s) => s.studyProgram === firstProgram)?.semester ?? 1;

        setStudyProgram(firstProgram);
        setSemester(firstSemester || 1);
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
    return students.filter(
      (s) => s.studyProgram === studyProgram && s.semester === semester
    );
  }, [students, studyProgram, semester]);

  const slots = useMemo(() => {
    return generateSlots(startTime, slotCount, slotDurationMinutes);
  }, [startTime, slotCount, slotDurationMinutes]);

  useEffect(() => {
    if (!studyProgram) return;
    if (semestersForProgram.length === 0) return;
    if (!semestersForProgram.includes(semester)) {
      setSemester(semestersForProgram[0]);
    }
  }, [studyProgram, semestersForProgram, semester]);

  const autoAssignments = useMemo(() => {
    return generateAutomaticAssignments(filteredStudents, companies, slots, preferences);
  }, [filteredStudents, companies, slots, preferences]);

  useEffect(() => {
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
  }, [autoAssignments, filteredStudents]);

  function updateAssignment(student: Student, patch: Partial<AssignmentDraft>) {
    setAssignments((prev) => ({
      ...prev,
      [student.id]: {
        companyId: prev[student.id]?.companyId ?? "",
        slot: prev[student.id]?.slot ?? "",
        ...patch,
      },
    }));
  }

  function saveEvent() {
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
    if (!semester) {
      setError("Bitte ein Semester auswählen.");
      return;
    }
    if (slots.length === 0) {
      setError("Bitte gültige Zeitslots definieren.");
      return;
    }

    const builtAssignments = filteredStudents
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
      .filter(Boolean);

    if (builtAssignments.length === 0) {
      setError("Es konnte kein gültiges Matching erzeugt werden.");
      return;
    }

    const event: JobDatingEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      studyProgram,
      semester,
      slotDurationMinutes,
      slots,
      assignments: builtAssignments as JobDatingEvent["assignments"],
      createdAt: new Date().toISOString(),
    };

    addEvent(event);
    setError(null);
    setTitle("");
    setDate("");
  }

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
              {semestersForProgram.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Startzeit</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>

          <label className="field">
            <span>Anzahl Slots</span>
            <input
              type="number"
              min={1}
              value={slotCount}
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
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
            />
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <strong>Generierte Slots:</strong>{" "}
          {slots.length > 0 ? slots.join(", ") : "Keine"}
        </div>

        {matchingInfo && (
          <div style={{ marginTop: 10 }}>
            <strong>Matching:</strong> {matchingInfo}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="formFooter">
          <button type="button" className="btn btnPrimary" onClick={saveEvent}>
            Termin speichern
          </button>
        </div>
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
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4}>Keine Studierende für diese Auswahl gefunden.</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.studyProgram}</td>
                  <td>
                    <select
                      className="tableSelect"
                      value={assignments[student.id]?.companyId ?? ""}
                      onChange={(e) =>
                        updateAssignment(student, { companyId: e.target.value })
                      }
                    >
                      <option value="">Keine Zuordnung</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="tableSelect"
                      value={assignments[student.id]?.slot ?? ""}
                      onChange={(e) =>
                        updateAssignment(student, { slot: e.target.value })
                      }
                    >
                      <option value="">Keine Zuordnung</option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Datum</th>
              <th>Programm</th>
              <th>Semester</th>
              <th>Zuweisungen</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6}>Noch keine Termine gespeichert.</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{event.studyProgram}</td>
                  <td>{event.semester}</td>
                  <td>{event.assignments.length}</td>
                  <td>
                    <button
                      className="btn btnDanger"
                      onClick={() => removeEvent(event.id)}
                    >
                      Löschen
                    </button>
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