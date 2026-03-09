// app/(app)/companies/[id]/edit/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CompanyStatus, useCompaniesStore } from "@/lib/companiesStore";

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

  const { getById, update } = useCompaniesStore();
  const company = useMemo(() => getById(id), [getById, id]);

  const [error, setError] = useState<string | null>(null);

  // form state (initialize once company exists)
  const [name, setName] = useState(company?.name ?? "");
  const [description, setDescription] = useState(company?.description ?? "");
  const [program, setProgram] = useState(company?.program ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "");
  const [website, setWebsite] = useState(company?.website ?? "");
  const [locations, setLocations] = useState(company?.locations ?? "");
  const [jobDescription, setJobDescription] = useState(company?.jobDescription ?? "");
  const [status, setStatus] = useState<CompanyStatus>(company?.status ?? "Aktiv");

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

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedProgram = program.trim();
    const trimmedIndustry = industry.trim();
    const normalizedWebsite = normalizeWebsite(website);

    if (!trimmedName) return setError("Bitte Name des Unternehmens eingeben.");
    if (!trimmedDesc) return setError("Bitte kurze Beschreibung eingeben.");
    if (!trimmedProgram) return setError("Bitte akademisches Programm eingeben.");
    if (!trimmedIndustry) return setError("Bitte Branche eingeben.");
    if (!normalizedWebsite) return setError("Bitte Website eingeben.");
    if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website-URL eingeben.");

    update(id, {
      name: trimmedName,
      description: trimmedDesc,
      program: trimmedProgram,
      industry: trimmedIndustry,
      website: normalizedWebsite,
      locations: locations.trim(),
      jobDescription: jobDescription.trim(),
      status,
    });

    router.push("/companies");
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

          <label className="field">
            <span>Akademisches Programm *</span>
            <input value={program} onChange={(e) => setProgram(e.target.value)} />
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
            <span>Branche *</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="z.B. IT" />
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

          <label className="field formFull">
            <span>Standort(e)</span>
            <input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="z.B. Graz, Kapfenberg" />
          </label>

          <label className="field formFull">
            <span>Stellenbeschreibung (für die Studierenden)</span>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Jobbeschreibung…"
            />
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