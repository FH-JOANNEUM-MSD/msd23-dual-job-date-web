"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompaniesStore } from "@/lib/companiesStore";
import { updateCompany, type CompanyStatus } from "@/lib/companiesApi";

function normalizeWebsite(input: string) {
  const v = input.trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isValidUrl(url: string) {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { getById, isLoading } = useCompaniesStore();
  const company = getById(id);

  const [error, setError] = useState<string | null>(null);

  // form state (initialize once company exists)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<CompanyStatus>("Aktiv");

  useEffect(() => {
    if (!company) return;
    setName(company.name ?? "");
    setDescription(company.description ?? "");
    setWebsite(company.website ?? "");
    setStatus(company.status ?? "Aktiv");
  }, [company]);

  if (isLoading) {
    return (
        <div className="formCard">
          <p className="muted">Unternehmen wird geladen...</p>
        </div>
    );
  }
  // If company wasn't ready on first render (rare), handle it:
  if (!company) {
    return (
      <>
        <h2>Unternehmen nicht gefunden</h2>
        <p className="muted">Diese ID existiert nicht (oder Mock-Daten wurden zurückgesetzt).</p>
        <button className="btn btnPrimary" onClick={() => router.push("/companies")}>
          Zurück zur Liste
        </button>
      </>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const normalizedWebsite = normalizeWebsite(website);

    if (!trimmedName) return setError("Bitte Name des Unternehmens eingeben.");
    if (!trimmedDesc) return setError("Bitte kurze Beschreibung eingeben.");
    if (!normalizedWebsite) return setError("Bitte Website eingeben.");
    if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website-URL eingeben.");

    try {
      await updateCompany(id, {
        name: trimmedName,
        description: trimmedDesc,
        website: normalizedWebsite,
        active: status === "Aktiv",
      });

      router.push("/companies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  return (
    <div className="formCard">
      <div className="formHeader">
        <div>
          <h2 style={{ margin: 0 }}>Unternehmensprofil bearbeiten</h2>
        </div>

        <button className="btn btnGhost" onClick={() => router.push("/companies")}>
          Zurück
        </button>
      </div>

      <form onSubmit={onSave}>
        <div className="formGrid">
          <label className="field">
            <span>Name des Unternehmens *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="field formFull">
            <span>Kurze Beschreibung des Unternehmens *</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Kurzbeschreibung…"
            />
          </label>

          <label className="field">
            <span>Webseite *</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
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

        <div className="formFooter">
          <button type="button" className="btn" onClick={() => router.push("/companies")}>
            Abbrechen
          </button>
          <button type="submit" className="btn btnPrimary">
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}