// app/(app)/companies/page.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { DEFAULT_COMPANY_PROGRAM, Company, CompanyStatus, useCompaniesStore } from "@/lib/companiesStore";

function normalizeWebsite(input: string) {
  const v = input.trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isValidUrl(url: string) {
  if (!url) return true; // allow empty
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function CompaniesPage() {
  const router = useRouter();
  const { companies, isLoading, loadError, refresh, remove, add } = useCompaniesStore();

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
    setMenuPos({ top: r.bottom + 6, left: r.right });
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

  // Keep portal menu positioned on scroll/resize
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

  // --- Add dialog state ---
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState("");
  const [program, setProgram] = useState(DEFAULT_COMPANY_PROGRAM);
  const [industry, setIndustry] = useState("IT");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<CompanyStatus>("Aktiv");
  const [error, setError] = useState<string | null>(null);

  function openAddDialog() {
    setOpenMenuId(null);
    setName("");
    setProgram(DEFAULT_COMPANY_PROGRAM);
    setIndustry("IT");
    setWebsite("");
    setStatus("Aktiv");
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  function onCreate(e: React.FormEvent) {
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

    const nameTaken = companies.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameTaken) return setError("Dieser Firmenname ist bereits vorhanden.");

    const newCompany: Company = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: "",
      program: trimmedProgram,
      industry: trimmedIndustry,
      website: normalizedWebsite,
      status,
      locations: "",
      jobDescription: "",
    };

    add(newCompany);
    closeDialog();

    // Nice UX: go directly to edit/profile page
    router.push(`/companies/${newCompany.id}/edit`);
  }

  function onDelete(id: string) {
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    const ok = confirm(`Unternehmen "${c.name}" wirklich löschen?`);
    if (!ok) return;
    setOpenMenuId(null);
    remove(id);
  }

  const activeCompany = useMemo(
    () => companies.find((x) => x.id === openMenuId) ?? null,
    [companies, openMenuId]
  );

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2 style={{ margin: 0 }}>Unternehmen</h2>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btnGhost" onClick={() => void refresh()}>
            Neu laden
          </button>
          <button className="btn btnPrimary" onClick={openAddDialog}>
            + Unternehmen hinzufügen
          </button>
        </div>
      </div>

      {loadError && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="error" style={{ marginBottom: 12 }}>
              {loadError}
            </p>
            <button className="btn btnPrimary" onClick={() => void refresh()}>
              Erneut versuchen
            </button>
          </div>
      )}

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
            {isLoading ? (
                    <tr>
                      <td colSpan={6} className="muted" style={{ padding: 16 }}>
                        Lade Unternehmen...
                      </td>
                    </tr>
                ) : companies.length === 0 ? (
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

      {/* Portal menu rendered outside the table */}
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
                  router.push(`/companies/${activeCompany.id}/edit`);
                }}
              >
                Profil bearbeiten
              </button>

              <button
                type="button"
                role="menuitem"
                className="kebabItem kebabDanger"
                onClick={() => onDelete(activeCompany.id)}
              >
                Löschen
              </button>
            </div>,
            document.body
          )
        : null}

      {/* Add company dialog */}
      <dialog ref={dialogRef} className="dialog">
        <form method="dialog" className="dialogInner" onSubmit={onCreate}>
          <div className="dialogHeader">
            <h3 style={{ margin: 0 }}>Unternehmen hinzufügen</h3>
            <button type="button" className="btn btnGhost" onClick={closeDialog} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="grid">
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
              <input value={program} onChange={(e) => setProgram(e.target.value)} />
            </label>

            <label className="field">
              <span>Branche</span>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </label>

            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as CompanyStatus)}>
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
              Erstellen & bearbeiten
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}