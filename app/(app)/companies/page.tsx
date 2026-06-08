"use client";

import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiClient";
import { inviteCompany, resendInvite } from "@/lib/inviteApi";
import { useCompaniesStore } from "@/lib/companiesStore";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeHeader(value: string) {
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
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const resendDialogRef = useRef<HTMLDialogElement | null>(null);
  const templatePreviewDialogRef = useRef<HTMLDialogElement | null>(null);
  const [resendEmail, setResendEmail] = useState("");

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

  function openInviteDialog() {
    setOpenMenuId(null);
    setCompanyName("");
    setInviteEmail("");
    setError(null);
    setInfo(null);
    dialogRef.current?.showModal();
  }

  function openResendDialog() {
    setOpenMenuId(null);
    setResendEmail("");
    setError(null);
    setInfo(null);
    resendDialogRef.current?.showModal();
  }

  async function onResendInvite(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = resendEmail.trim();

    if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
    if (!isValidEmail(trimmedEmail)) return setError("Bitte gültige E-Mail eingeben.");

    try {
      await resendInvite({
        email: trimmedEmail,
        role: "company",
      });

      setInfo("Einladung wurde erneut versendet.");
      resendDialogRef.current?.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Einladung konnte nicht erneut versendet werden.");
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedName = companyName.trim();
    const trimmedEmail = inviteEmail.trim();

    if (!trimmedName) return setError("Bitte Firmenname eingeben.");
    if (!trimmedEmail) return setError("Bitte E-Mail eingeben.");
    if (!isValidEmail(trimmedEmail)) return setError("Bitte eine gültige E-Mail eingeben.");

    try {
      await inviteCompany({
        email: trimmedEmail,
        companyName: trimmedName,
      });

      setInfo(`Einladung an ${trimmedEmail} wurde versendet.`);
      closeDialog();
      await refresh();
    } catch (err) {
      const message =
          err instanceof ApiError ? err.message : "Einladung konnte nicht versendet werden.";
      setError(message);
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

        const nameValue =
            getCell("companyname") ||
            getCell("firmenname") ||
            getCell("firma") ||
            getCell("name");

        const emailValue = getCell("email") || getCell("emailadresse") || getCell("mail");

        if (!nameValue && !emailValue) continue;

        if (!nameValue || !emailValue || !isValidEmail(emailValue)) {
          skippedRows += 1;
          continue;
        }

        inviteRows.push({
          companyName: nameValue,
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
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Einladung fehlgeschlagen";
          failed.push(`${inviteRow.email}: ${message}`);
        }
      }

      if (successCount > 0) await refresh();

      setInfo(
          `${successCount} Unternehmenseinladungen versendet.${
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
    } catch (err) {
      const message =
          err instanceof Error ? err.message : "Excel-Import fehlgeschlagen. Bitte Datei prüfen.";
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
      await remove(deleteId);
      await refresh();
      setInfo("Unternehmen wurde erfolgreich gelöscht.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Löschen fehlgeschlagen.";
      setImportError(message);
    } finally {
      deleteDialogRef.current?.close();
      setDeleteId(null);
    }
  }

  const activeCompany = useMemo(
      () => companies.find((x) => x.id === openMenuId) ?? null,
      [companies, openMenuId]
  );

  const deleteCompanyItem = useMemo(
      () => companies.find((x) => x.id === deleteId) ?? null,
      [companies, deleteId]
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

            

            <button
                type="button"
                className="btn btnGhost"
                aria-label="Template Vorschau"
                title="Template Vorschau"
                onClick={() => templatePreviewDialogRef.current?.showModal()}
            >
              <img src="/file-preview.jpg" alt="" width={20} height={20} />
            </button>

            <button className="btn btnGhost" onClick={() => fileInputRef.current?.click()}>
              Excel importieren
            </button>

            {/*<button className="btn btnGhost" onClick={() => void refresh()}>*/}
            {/*  Neu laden*/}
            {/*</button>*/}

            <button className="btn btnPrimary" onClick={openInviteDialog}>
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

        {error && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="error" style={{ margin: 0 }}>
                {error}
              </p>
            </div>
        )}

        <div className="tableWrap">
          <table className="table">
            <thead>
            <tr>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "35%" }}>Beschreibung</th>
              <th style={{ width: "22%" }}>Website</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "7%" }}>Aktionen</th>
            </tr>
            </thead>

            <tbody>
            {isLoading ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: 16 }}>
                    Lade Unternehmen...
                  </td>
                </tr>
            ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: 16 }}>
                    Keine Unternehmen vorhanden.
                  </td>
                </tr>
            ) : (
                companies.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.description || <span className="muted">Nicht angegeben</span>}</td>
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
                      className="kebabItem"
                      onClick={() => {
                        setOpenMenuId(null);
                        router.push(`/companies/${activeCompany.id}`);
                      }}
                  >
                    Unternehmensseite ansehen
                  </button>


                  <button
                      type="button"
                      role="menuitem"
                      className="kebabItem"
                      onClick={openResendDialog}
                  >
                    Einladung erneut senden
                  </button>

                  {/*<button*/}
                  {/*    type="button"*/}
                  {/*    role="menuitem"*/}
                  {/*    className="kebabItem kebabDanger"*/}
                  {/*    onClick={() => openDeleteDialog(activeCompany.id)}*/}
                  {/*>*/}
                  {/*  Löschen*/}
                  {/*</button>*/}
                </div>,
                document.body
            )
            : null}

        <dialog ref={dialogRef} className="dialog">
          <form method="dialog" className="dialogInner" onSubmit={onInvite}>
            <div className="dialogHeader">
              <h3 style={{ margin: 0 }}>Unternehmen einladen</h3>
            </div>

            <div className="grid">
              <label className="field">
                <span>Firmenname</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus />
              </label>

              <label className="field">
                <span>E-Mail</span>
                <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="z.B. firma@example.com"
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

        <dialog ref={deleteDialogRef} className="dialog">
          <div className="dialogInner">
            <h3>Unternehmen löschen</h3>
            <p>
              Willst du{" "}
              {deleteCompanyItem?.name ? `"${deleteCompanyItem.name}"` : "dieses Unternehmen"} wirklich
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

        <dialog ref={resendDialogRef} className="dialog">
          <form className="dialogInner" onSubmit={onResendInvite}>
            <div className="dialogHeader">
              <h3 style={{ margin: 0 }}>Einladung erneut senden</h3>

            </div>

            <label className="field">
              <span>E-Mail</span>
              <input
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="firma@example.com"
                  autoFocus
              />
            </label>

            {error && <p className="error">{error}</p>}

            <div className="dialogActions">
              <button
                  type="button"
                  className="btn"
                  onClick={() => resendDialogRef.current?.close()}
              >
                Abbrechen
              </button>

              <button type="submit" className="btn btnPrimary">
                Einladung erneut senden
              </button>
            </div>
          </form>
        </dialog>

        <dialog ref={templatePreviewDialogRef} className="dialog">
          <div className="dialogInner">
            <div className="dialogHeader">
              <h3 style={{ margin: 0 }}>Template Vorschau</h3>
            </div>

            <img
                src="/unternehmen_vorschau.png"
                alt="Excel Import Template"
                style={{ width: "100%", height: "auto" }}
            />

            <div className="dialogActions">
              <button className="btn" onClick={() => templatePreviewDialogRef.current?.close()}>
                Schließen
              </button>
            </div>
          </div>
        </dialog>
      </>
  );
}