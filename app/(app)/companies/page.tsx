"use client";

import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Status = "Aktiv" | "Inaktiv";

type Company = {
  id: string;
  name: string;
  description: string; // not shown in table, but stored for edit/detail
  program: string;
  industry: string; // "Branche"
  website: string;
  status: Status;
};

const DEFAULT_PROGRAM = "Mobile Software Development";

const initialCompanies: Company[] = [
  {
    id: "c1",
    name: "Test AG",
    description: "Ein Beispielunternehmen für Demo-Zwecke.",
    program: DEFAULT_PROGRAM,
    industry: "IT",
    website: "https://www.fh-joanneum.at",
    status: "Aktiv",
  },
  {
    id: "c2",
    name: "Test2 AG",
    description: "Noch ein Unternehmen. Beschreibung wird später in Detailansicht genutzt.",
    program: DEFAULT_PROGRAM,
    industry: "IT",
    website: "https://www.fh-joanneum.at",
    status: "Aktiv",
  },
];

function normalizeWebsite(input: string) {
  const v = input.trim();
  if (!v) return "";
  // If user entered "example.com", prefix https://
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isValidUrl(url: string) {
  if (!url) return true; // allow empty
  try {
    // will throw if invalid
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

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
    setMenuPos({ top: r.bottom + 6, left: r.right }); // right-aligned via CSS translateX(-100%)
  }

  // Close menu on outside click + ESC
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

  // Keep portal menu positioned on scroll/resize (including nested scroll containers)
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

  // --- Dialog + form state ---
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [program, setProgram] = useState(DEFAULT_PROGRAM);
  const [industry, setIndustry] = useState("IT");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("Aktiv");
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  function openAddDialog() {
    setOpenMenuId(null);
    setEditingId(null);
    setName("");
    setDescription("");
    setProgram(DEFAULT_PROGRAM);
    setIndustry("IT");
    setWebsite("");
    setStatus("Aktiv");
    setError(null);
    dialogRef.current?.showModal();
  }

  function openEditDialog(c: Company) {
    setOpenMenuId(null);
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description);
    setProgram(c.program);
    setIndustry(c.industry);
    setWebsite(c.website);
    setStatus(c.status);
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
    const trimmedProgram = program.trim();
    const trimmedIndustry = industry.trim();
    const normalizedWebsite = normalizeWebsite(website);

    if (!trimmedName) return setError("Bitte Firmenname eingeben.");
    if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");
    if (!trimmedIndustry) return setError("Bitte Branche eingeben.");
    if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website-URL eingeben.");

    // Optional: prevent duplicate name (handy constraint)
    const nameTaken = companies.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingId
    );
    if (nameTaken) return setError("Dieser Firmenname ist bereits vorhanden.");

    if (editingId) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: trimmedName,
                description: description.trim(),
                program: trimmedProgram,
                industry: trimmedIndustry,
                website: normalizedWebsite,
                status,
              }
            : c
        )
      );
    } else {
      const newCompany: Company = {
        id: crypto.randomUUID(),
        name: trimmedName,
        description: description.trim(),
        program: trimmedProgram,
        industry: trimmedIndustry,
        website: normalizedWebsite,
        status,
      };
      setCompanies((prev) => [newCompany, ...prev]);
    }

    closeDialog();
  }

  function onDelete(id: string) {
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    const ok = confirm(`Unternehmen "${c.name}" wirklich löschen?`);
    if (!ok) return;
    setCompanies((prev) => prev.filter((x) => x.id !== id));
  }

  const activeCompany = companies.find((x) => x.id === openMenuId) ?? null;

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2 style={{ margin: 0 }}>Unternehmen</h2>
        </div>

        <button className="btn btnPrimary" onClick={openAddDialog}>
          + Unternehmen hinzufügen
        </button>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "24%" }}>Akademisches Programm</th>
              <th style={{ width: "14%" }}>Branche</th>
              <th style={{ width: "22%" }}>Website</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "10%" }}>Aktionen</th>
            </tr>
          </thead>

          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 16 }}>
                  Keine Unternehmen vorhanden.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.program}</td>
                  <td>{c.industry}</td>
                  <td>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer">
                        {c.website}
                      </a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${c.status === "Aktiv" ? "pillActive" : "pillInactive"}`}>
                      {c.status}
                    </span>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div className="kebab" data-kebab-root>
                      <button
                        type="button"
                        className="kebabBtn"
                        aria-label="Aktionen"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          anchorBtnRef.current = e.currentTarget;
                          updateMenuPos();
                          setOpenMenuId((prev) => (prev === c.id ? null : c.id));
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
      {mounted && openMenuId && menuPos && activeCompany
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
                  openEditDialog(activeCompany);
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
                  onDelete(activeCompany.id);
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
            <h3 style={{ margin: 0 }}>
              {isEditing ? "Unternehmen bearbeiten" : "Unternehmen hinzufügen"}
            </h3>
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
                placeholder="z.B. Musterfirma GmbH"
                autoFocus
              />
            </label>

            <label className="field">
              <span>Website</span>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="z.B. https://example.com"
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
              <span>Branche</span>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="z.B. IT"
              />
            </label>

            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Beschreibung</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurzbeschreibung…"
                rows={4}
              />
            </label>

            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
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