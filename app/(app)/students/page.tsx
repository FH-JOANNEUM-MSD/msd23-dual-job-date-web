"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { ApiError } from "@/lib/apiClient";
import { inviteStudent } from "@/lib/inviteApi";
import { getStudents, updateStudent, deleteStudent, type Student } from "@/lib/studentsApi";

const DEFAULT_PROGRAM = "Mobile Software Development";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function clampSemester(value: number) {
  if (!Number.isFinite(value)) return 1;
  if (value < 1) return 1;
  if (value > 8) return 8;
  return value;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState(DEFAULT_PROGRAM);
  const [semester, setSemester] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

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
      if (!target?.closest?.("[data-kebab-root]")) setOpenMenuId(null);
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

  function openAddDialog() {
    setOpenMenuId(null);
    setEditingId(null);
    setName("");
    setEmail("");
    setProgram(DEFAULT_PROGRAM);
    setSemester(1);
    setError(null);
    setInfo(null);
    dialogRef.current?.showModal();
  }

  function openEditDialog(s: Student) {
    setOpenMenuId(null);
    setEditingId(s.id);
    setName(s.name);
    setProgram(s.studyProgram);
    setSemester(s.semester ?? 1);
    setError(null);
    setInfo(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedProgram = program.trim();
    const safeSemester = clampSemester(Number(semester));

    if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");

    if (!isEditing) {
      if (!trimmedName) return setError("Bitte Name eingeben.");
      if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
      if (!isValidEmail(trimmedEmail)) return setError("Bitte eine gültige E-Mail eingeben.");

      try {
        await inviteStudent({
          email: trimmedEmail,
          fullName: trimmedName,
          studyProgram: trimmedProgram,
          semester: safeSemester,
        });

        await loadStudents();
        setInfo("Einladung wurde erfolgreich versendet.");
        closeDialog();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Einladung fehlgeschlagen.");
      }

      return;
    }

    if (!trimmedName) return setError("Bitte Name eingeben.");

    const parts = trimmedName.split(/\s+/);
    const first_name = parts[0] ?? "";
    const last_name = parts.slice(1).join(" ");

    try {
      await updateStudent(editingId!, {
        first_name,
        last_name,
        study_program: trimmedProgram,
        semester: safeSemester,
      });

      await loadStudents();
      setInfo("Studierende wurden erfolgreich aktualisiert.");
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  async function onImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setInfo(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      if (!sheet) throw new Error("Die Excel-Datei enthält kein gültiges Arbeitsblatt.");

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
      });

      if (rows.length < 2) {
        throw new Error("Bitte eine Excel-Datei mit Header und mindestens einer Zeile hochladen.");
      }

      const headers = (rows[0] as unknown[]).map((cell) => normalizeHeader(String(cell ?? "")));
      const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

      type InviteRow = {
        fullName: string;
        email: string;
        studyProgram: string;
        semester: number;
      };

      const inviteRows: InviteRow[] = [];
      let skippedRows = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] as unknown[];

        const getCell = (column: string): string => {
          const index = headerIndex[column];
          return index === undefined ? "" : String(row[index] ?? "").trim();
        };

        const firstName = getCell("firstname");
        const lastName = getCell("lastname");
        const nameFromColumn = getCell("name");
        const fullName = `${firstName} ${lastName}`.trim() || nameFromColumn || "";

        const emailValue = getCell("email") || getCell("emailadresse") || getCell("mail");
        const studyProgram = getCell("studyprogram");
        const semesterRaw = getCell("semester");
        const semesterNumber = Number(semesterRaw);

        if (!fullName && !emailValue && !studyProgram && !semesterRaw) continue;

        if (
            !fullName ||
            !emailValue ||
            !isValidEmail(emailValue) ||
            !studyProgram ||
            !Number.isFinite(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 8
        ) {
          skippedRows += 1;
          continue;
        }

        inviteRows.push({
          fullName,
          email: emailValue,
          studyProgram,
          semester: semesterNumber,
        });
      }

      if (inviteRows.length === 0) {
        throw new Error("Keine verwertbaren Zeilen in der Excel-Datei gefunden.");
      }

      let successCount = 0;
      const failed: string[] = [];

      for (const inviteRow of inviteRows) {
        try {
          await inviteStudent(inviteRow);
          successCount += 1;
        } catch (error) {
          const message = error instanceof ApiError ? error.message : "Einladung fehlgeschlagen";
          failed.push(`${inviteRow.email}: ${message}`);
        }
      }

      if (successCount > 0) await loadStudents();

      setInfo(
          `${successCount} Einladungen versendet.${
              skippedRows > 0 ? ` ${skippedRows} Zeilen übersprungen.` : ""
          }`
      );

      if (failed.length > 0) {
        const preview = failed.slice(0, 3).join(" | ");
        setImportError(
            `${failed.length} Einladungen fehlgeschlagen.${
                preview ? ` Beispiele: ${preview}` : ""
            }`
        );
      }
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "Excel-Import fehlgeschlagen. Bitte Datei prüfen.";
      setImportError(message);
    } finally {
      event.target.value = "";
    }
  }

  function openDeleteDialog(id: string) {
    setDeleteId(id);
    setOpenMenuId(null);
    deleteDialogRef.current?.showModal();
  }

  async function confirmDelete() {
    if (!deleteId) return;

    try {
      await deleteStudent(deleteId);
      await loadStudents();
      setInfo("Studierende wurden erfolgreich gelöscht.");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
    } finally {
      deleteDialogRef.current?.close();
      setDeleteId(null);
    }
  }

  const activeStudent = students.find((x) => x.id === openMenuId) ?? null;
  const deleteStudentItem = students.find((x) => x.id === deleteId) ?? null;

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
              <p className="error" style={{ margin: 0 }}>
                {importError}
              </p>
            </div>
        )}

        {info && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ margin: 0 }}>{info}</p>
            </div>
        )}

        <div className="tableWrap">
          <table className="table">
            <thead>
            <tr>
              <th style={{ width: "30%" }}>Name</th>
              <th style={{ width: "35%" }}>Akademisches Programm</th>
              <th style={{ width: "10%" }}>Semester</th>
              <th style={{ width: "7%" }}>Aktionen</th>
            </tr>
            </thead>

            <tbody>
            {isLoading ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    Lade Studierende...
                  </td>
                </tr>
            ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    Keine Studierende vorhanden.
                  </td>
                </tr>
            ) : (
                students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.studyProgram}</td>
                      <td>{s.semester ?? "—"}</td>

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
                      onClick={() => openDeleteDialog(activeStudent.id)}
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
              <h3 style={{ margin: 0 }}>
                {isEditing ? "Studierende bearbeiten" : "Studierende einladen"}
              </h3>
              <button type="button" className="btn btnGhost" onClick={closeDialog}>
                ✕
              </button>
            </div>

            <div className="grid">
              <label className="field">
                <span>Name</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    autoFocus
                />
              </label>

              {!isEditing && (
                  <label className="field">
                    <span>E-Mail</span>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="z.B. student@example.com"
                    />
                  </label>
              )}

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
                    max={8}
                    value={semester}
                    onChange={(e) => setSemester(clampSemester(Number(e.target.value)))}
                />
              </label>

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

        <dialog ref={deleteDialogRef} className="dialog">
          <div className="dialogInner">
            <h3>Studierende löschen</h3>
            <p>
              Willst du{" "}
              {deleteStudentItem?.name ? `"${deleteStudentItem.name}"` : "diese Person"} wirklich
              löschen?
            </p>

            <div className="dialogActions">
              <button className="btn" onClick={() => deleteDialogRef.current?.close()}>
                Abbrechen
              </button>

              <button className="btn btnDanger" onClick={() => void confirmDelete()}>
                Löschen
              </button>
            </div>
          </div>
        </dialog>
      </>
  );
}