"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { ApiError } from "@/lib/apiClient";
import { inviteStudent } from "@/lib/inviteApi";
import { getStudents, type Student, type StudentStatus } from "@/lib/studentsApi";

const DEFAULT_PROGRAM = "Mobile Software Development";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseProgramInput(
  input: string
): { program: string; studyProgram: string; semester: number | null } {
  const trimmed = input.trim() || DEFAULT_PROGRAM;

  const match = trimmed.match(/^(.*)\s+\(Semester\s+(\d+)\)$/i);
  if (match) {
    return {
      program: trimmed,
      studyProgram: match[1].trim(),
      semester: Number(match[2]),
    };
  }

  return {
    program: trimmed,
    studyProgram: trimmed,
    semester: null,
  };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseImportedStatus(value: unknown): StudentStatus {
  if (typeof value === "boolean") return value ? "Aktiv" : "Inaktiv";
  if (typeof value === "number") return value === 1 ? "Aktiv" : "Inaktiv";
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["aktiv", "active", "1", "true", "yes", "ja"].includes(normalized)) {
      return "Aktiv";
    }
  }
  return "Inaktiv";
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Kebab menu (portal) state ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => setMounted(true), []);

  async function loadStudents() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Studierende konnten nicht geladen werden.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  function updateMenuPos() {
    const el = anchorBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, left: r.right });
  }

  React.useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-kebab-root]")) {
        setOpenMenuId(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenuId(null);
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (!openMenuId) return;

    updateMenuPos();
    const onMove = () => updateMenuPos();

    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);

    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [openMenuId]);

  // dialog + form state
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState(DEFAULT_PROGRAM);
  const [status, setStatus] = useState<StudentStatus>("Aktiv");
  const [inviteSemester, setInviteSemester] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  function openAddDialog() {
    setOpenMenuId(null);
    setEditingId(null);
    setName("");
    setEmail("");
    setProgram(DEFAULT_PROGRAM);
    setInviteSemester("1");
    setStatus("Aktiv");
    setError(null);
    dialogRef.current?.showModal();
  }

  function openEditDialog(s: Student) {
    setOpenMenuId(null);
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email);
    setProgram(s.program);
    setStatus(s.status);
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedProgram = program.trim();

    if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
    if (!isValidEmail(trimmedEmail)) return setError("Bitte eine gültige E-Mail eingeben.");

    if (editingId) {
      if (!trimmedName) return setError("Bitte Name eingeben.");
      if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");

      const emailTaken = students.some(
        (s) => s.email.toLowerCase() === trimmedEmail.toLowerCase() && s.id !== editingId
      );
      if (emailTaken) return setError("Diese E-Mail ist bereits vergeben.");

      const parsedProgram = parseProgramInput(trimmedProgram);

      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: trimmedName,
                email: trimmedEmail,
                program: parsedProgram.program,
                studyProgram: parsedProgram.studyProgram,
                semester: parsedProgram.semester,
                status,
              }
            : s
        )
      );

      closeDialog();
      return;
    }

    if (!trimmedName) return setError("Bitte Name eingeben.");
    if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");

    const semesterNumber = Number(inviteSemester);
    if (!Number.isFinite(semesterNumber) || semesterNumber < 1) {
      return setError("Bitte ein gültiges Semester eingeben.");
    }

    try {
      await inviteStudent({
        email: trimmedEmail,
        fullName: trimmedName,
        studyProgram: trimmedProgram,
        semester: semesterNumber,
      });

      setImportInfo(`Einladung an ${trimmedEmail} wurde versendet.`);
      closeDialog();
      void loadStudents();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Einladung konnte nicht versendet werden.";
      setError(message);
    }
  }

  function onDelete(id: string) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    const ok = confirm(`Student "${s.name}" wirklich löschen?`);
    if (!ok) return;
    setStudents((prev) => prev.filter((x) => x.id !== id));
  }

  async function onImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportInfo(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      if (!sheet) {
        throw new Error("Die Excel-Datei enthält kein gültiges Arbeitsblatt.");
      }

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
      });

      if (rows.length < 2) {
        throw new Error("Bitte eine Excel-Datei mit Header und mindestens einer Zeile hochladen.");
      }

      const headers = (rows[0] as unknown[]).map((cell) => normalizeHeader(String(cell ?? "")));
      const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

      const hasStudyProgram = headerIndex.studyprogram !== undefined;
      const hasSemester = headerIndex.semester !== undefined;
      if (!hasStudyProgram || !hasSemester) {
        throw new Error(
          "Fehlende Spalten. Erwartet werden mindestens: study_program und semester."
        );
      }

      const importedStudents: Student[] = [];

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] as unknown[];
        const getCell = (column: string): string => {
          const index = headerIndex[column];
          return index === undefined ? "" : String(row[index] ?? "").trim();
        };

        const studyProgram = getCell("studyprogram");
        const semesterRaw = getCell("semester");
        if (!studyProgram && !semesterRaw) continue;

        const semesterNumber = Number(semesterRaw);
        const semester = Number.isFinite(semesterNumber) ? semesterNumber : null;
        const program = semester ? `${studyProgram} (Semester ${semester})` : studyProgram;

        const firstName = getCell("firstname");
        const lastName = getCell("lastname");
        const nameFromColumn = getCell("name");
        const name = `${firstName} ${lastName}`.trim() || nameFromColumn || "Unbekannt";

        const email = getCell("email") || getCell("emailadresse") || getCell("mail");
        const statusValue = getCell("status");

        importedStudents.push({
          id: crypto.randomUUID(),
          name,
          email,
          program: program || DEFAULT_PROGRAM,
          studyProgram: studyProgram || DEFAULT_PROGRAM,
          semester,
          status: parseImportedStatus(statusValue || "aktiv"),
        });
      }

      if (importedStudents.length === 0) {
        throw new Error("Keine verwertbaren Zeilen in der Excel-Datei gefunden.");
      }

      setStudents(importedStudents);
      setImportInfo(`${importedStudents.length} Studierende erfolgreich aus Excel importiert.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Excel-Import fehlgeschlagen. Bitte Datei prüfen.";
      setImportError(message);
    } finally {
      event.target.value = "";
    }
  }

  const activeStudent = students.find((x) => x.id === openMenuId) ?? null;

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2 style={{ margin: 0 }}>Studierende</h2>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => void onImportExcel(e)}
          />
          <button className="btn btnGhost" onClick={() => fileInputRef.current?.click()}>
            Excel importieren
          </button>
          <button className="btn btnGhost" onClick={() => void loadStudents()}>
            Neu laden
          </button>
          <button className="btn btnPrimary" onClick={openAddDialog}>
            + Studierende einladen
          </button>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ marginBottom: 12 }}>
            {loadError}
          </p>
          <button className="btn btnPrimary" onClick={() => void loadStudents()}>
            Erneut versuchen
          </button>
        </div>
      )}

      {importError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>{importError}</p>
        </div>
      )}

      {importInfo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{importInfo}</p>
        </div>
      )}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Name</th>
              <th style={{ width: "26%" }}>Email</th>
              <th style={{ width: "28%" }}>Akademisches Programm</th>
              <th style={{ width: "12%" }}>Status</th>
              <th style={{ width: "12%" }}>Aktionen</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
                  Lade Studierende...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
                  Keine Studierende vorhanden.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email || <span className="muted">Nicht angegeben</span>}</td>
                  <td>{s.program}</td>
                  <td>
                    <span className={`pill ${s.status === "Aktiv" ? "pillActive" : "pillInactive"}`}>
                      {s.status}
                    </span>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div className="kebab" data-kebab-root>
                      <button
                        type="button"
                        className="kebabBtn"
                        aria-label="Aktionen"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          anchorBtnRef.current = e.currentTarget;
                          updateMenuPos();
                          setOpenMenuId((prev) => (prev === s.id ? null : s.id));
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mounted && openMenuId && menuPos && activeStudent
        ? createPortal(
            <div
              className="kebabMenuPortal"
              data-kebab-root
              role="menu"
              aria-label="Aktionen Menü"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                type="button"
                role="menuitem"
                className="kebabItem"
                onClick={() => {
                  setOpenMenuId(null);
                  openEditDialog(activeStudent);
                }}
              >
                Bearbeiten
              </button>

              <button
                type="button"
                role="menuitem"
                className="kebabItem kebabDanger"
                onClick={() => {
                  setOpenMenuId(null);
                  onDelete(activeStudent.id);
                }}
              >
                Löschen
              </button>
            </div>,
            document.body
          )
        : null}

      <dialog
        ref={dialogRef}
        className="dialog"
        onClose={() => {
          setEditingId(null);
          setError(null);
        }}
      >
        <form method="dialog" className="dialogInner" onSubmit={onSubmit}>
          <div className="dialogHeader">
            <h3 style={{ margin: 0 }}>{isEditing ? "Studierende bearbeiten" : "Studierende einladen"}</h3>
            <button type="button" className="btn btnGhost" onClick={closeDialog} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="grid">
            {isEditing ? (
              <>
                <label className="field">
                  <span>Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    autoFocus
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="z.B. max.mustermann@fh-joanneum.at"
                  />
                </label>

                <label className="field">
                  <span>Akademisches Programm</span>
                  <input
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder={DEFAULT_PROGRAM}
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)}>
                    <option value="Aktiv">Aktiv</option>
                    <option value="Inaktiv">Inaktiv</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="field">
                  <span>Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    autoFocus
                  />
                </label>

                <label className="field">
                  <span>E-Mail</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="z.B. student@example.com"
                  />
                </label>

                <label className="field">
                  <span>Akademisches Programm</span>
                  <input
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder={DEFAULT_PROGRAM}
                  />
                </label>

                <label className="field">
                  <span>Semester</span>
                  <input
                    type="number"
                    min={1}
                    value={inviteSemester}
                    onChange={(e) => setInviteSemester(e.target.value)}
                    placeholder="z.B. 2"
                  />
                </label>
              </>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="dialogActions">
            <button type="button" className="btn" onClick={closeDialog}>
              Abbrechen
            </button>
            <button type="submit" className="btn btnPrimary">
              {isEditing ? "Speichern" : "Einladung senden"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}