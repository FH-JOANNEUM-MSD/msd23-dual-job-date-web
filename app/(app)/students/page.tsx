"use client";

import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type StudentStatus = "Aktiv" | "Inaktiv";

type Student = {
  id: string;
  name: string;
  email: string;
  program: string;
  status: StudentStatus;
};

const DEFAULT_PROGRAM = "Mobile Software Development";

const initialStudents: Student[] = [
  {
    id: "s1",
    name: "Max Mustermann",
    email: "max.mustermann@fh-joanneum.at",
    program: DEFAULT_PROGRAM,
    status: "Aktiv",
  },
  {
    id: "s2",
    name: "Erika Musterfrau",
    email: "erika.musterfrau@fh-joanneum.at",
    program: DEFAULT_PROGRAM,
    status: "Inaktiv",
  },
];

function isValidEmail(email: string) {
  // simple and sufficient for UI validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  // --- Kebab menu (portal) state ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => setMounted(true), []);

  function updateMenuPos() {
    const el = anchorBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // right-aligned menu: we'll position with left=r.right and CSS translateX(-100%)
    setMenuPos({ top: r.bottom + 6, left: r.right });
  }

  // Close on outside click + ESC
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

  // Keep portal menu positioned on scroll/resize (works for nested scroll containers too)
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
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  function openAddDialog() {
    setOpenMenuId(null);
    setEditingId(null);
    setName("");
    setEmail("");
    setProgram(DEFAULT_PROGRAM);
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedProgram = program.trim();

    if (!trimmedName) return setError("Bitte Name eingeben.");
    if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
    if (!isValidEmail(trimmedEmail)) return setError("Bitte eine gültige E-Mail eingeben.");
    if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");

    // prevent duplicate email (common real-world constraint)
    const emailTaken = students.some(
      (s) => s.email.toLowerCase() === trimmedEmail.toLowerCase() && s.id !== editingId
    );
    if (emailTaken) return setError("Diese E-Mail ist bereits vergeben.");

    if (editingId) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, name: trimmedName, email: trimmedEmail, program: trimmedProgram, status }
            : s
        )
      );
    } else {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        name: trimmedName,
        email: trimmedEmail,
        program: trimmedProgram || DEFAULT_PROGRAM,
        status,
      };
      setStudents((prev) => [newStudent, ...prev]);
    }

    closeDialog();
  }

  function onDelete(id: string) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    const ok = confirm(`Student "${s.name}" wirklich löschen?`);
    if (!ok) return;
    setStudents((prev) => prev.filter((x) => x.id !== id));
  }

  const activeStudent = students.find((x) => x.id === openMenuId) ?? null;

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2 style={{ margin: 0 }}>Studenten</h2>
        </div>

        <button className="btn btnPrimary" onClick={openAddDialog}>
          + Student hinzufügen
        </button>
      </div>

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
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
                  Keine Studenten vorhanden.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
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
                          anchorBtnRef.current = e.currentTarget; // anchor for portal positioning
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

      {/* Portal menu rendered outside the table so it can't get clipped */}
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
            <h3 style={{ margin: 0 }}>{isEditing ? "Student bearbeiten" : "Student hinzufügen"}</h3>
            <button type="button" className="btn btnGhost" onClick={closeDialog} aria-label="Close">
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
          </div>

          {error && <p className="error">{error}</p>}

          <div className="dialogActions">
            <button type="button" className="btn" onClick={closeDialog}>
              Abbrechen
            </button>
            <button type="submit" className="btn btnPrimary">
              {isEditing ? "Speichern" : "Hinzufügen"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}