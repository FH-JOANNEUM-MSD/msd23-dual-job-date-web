"use client";

import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiClient";
import { inviteCompany } from "@/lib/inviteApi";
import { useCompaniesStore } from "@/lib/companiesStore";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function CompaniesPage() {
  const router = useRouter();
  const { companies, isLoading, loadError, refresh, remove } = useCompaniesStore();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

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
    setName("");
    setInviteEmail("");
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteInfo(null);

    const trimmedName = name.trim();
    const trimmedEmail = inviteEmail.trim();

    if (!trimmedName) return setError("Bitte Firmenname eingeben.");
    if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
    if (!isValidEmail(trimmedEmail)) return setError("Bitte eine gültige E-Mail eingeben.");

    try {
      await inviteCompany({
        email: trimmedEmail,
        companyName: trimmedName,
      });

      setInviteInfo(`Einladung an ${trimmedEmail} wurde versendet.`);
      closeDialog();
      void refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Einladung konnte nicht versendet werden.";
      setError(message);
    }
  }

  async function onImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setInviteInfo(null);

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

      type InviteRow = {
        companyName: string;
        email: string;
      };

      const inviteRows: InviteRow[] = [];
      let skippedRows = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] as unknown[];

        const getCell = (column: string): string => {
          const index = headerIndex[column];
          return index === undefined ? "" : String(row[index] ?? "").trim();
        };

        const companyName =
          getCell("companyname") ||
          getCell("firmenname") ||
          getCell("firma") ||
          getCell("name");
        const emailValue = getCell("email") || getCell("emailadresse") || getCell("mail");

        if (!companyName && !emailValue) {
          continue;
        }

        if (!companyName || !emailValue || !isValidEmail(emailValue)) {
          skippedRows += 1;
          continue;
        }

        inviteRows.push({
          companyName,
          email: emailValue,
        });
      }

      if (inviteRows.length === 0) {
        throw new Error("Keine verwertbaren Zeilen in der Excel-Datei gefunden.");
      }

      let successCount = 0;
      const failed: string[] = [];

      for (const inviteRow of inviteRows) {
        try {
          await inviteCompany(inviteRow);
          successCount += 1;
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : "Einladung fehlgeschlagen";
          failed.push(`${inviteRow.email}: ${message}`);
        }
      }

      if (successCount > 0) {
        await refresh();
      }

      setInviteInfo(
        `${successCount} Unternehmenseinladungen versendet.${skippedRows > 0 ? ` ${skippedRows} Zeilen übersprungen.` : ""}`
      );

      if (failed.length > 0) {
        const preview = failed.slice(0, 3).join(" | ");
        setImportError(
          `${failed.length} Einladungen fehlgeschlagen.${preview ? ` Beispiele: ${preview}` : ""}`
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
          <button className="btn btnGhost" onClick={() => void refresh()}>
            Neu laden
          </button>
          <button className="btn btnPrimary" onClick={openAddDialog}>
            + Unternehmen einladen
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

      {importError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>{importError}</p>
        </div>
      )}

      {inviteInfo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{inviteInfo}</p>
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

      <dialog ref={dialogRef} className="dialog">
        <form method="dialog" className="dialogInner" onSubmit={onCreate}>
          <div className="dialogHeader">
            <h3 style={{ margin: 0 }}>Unternehmen einladen</h3>
            <button type="button" className="btn btnGhost" onClick={closeDialog} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="grid">
            <label className="field">
              <span>Firmenname</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </label>

            <label className="field">
              <span>E-Mail</span>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="z.B. company@example.com"
              />
            </label>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="dialogActions">
            <button type="button" className="btn" onClick={closeDialog}>
              Abbrechen
            </button>
            <button type="submit" className="btn btnPrimary">
              Einladung senden
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}