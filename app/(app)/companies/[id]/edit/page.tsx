"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {getCompanyById, updateCompany, uploadCompanyLogo, uploadCompanyImage, type Company, type CompanyStatus} from "@/lib/companiesApi";

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
  const companyId = params.id;
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<CompanyStatus>("Aktiv");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function fillForm(c: Company) {
    setName(c.name ?? "");
    setShortDescription(c.shortDescription ?? "");
    setDescription(c.description ?? "");
    setWebsite(c.website ?? "");
    setStatus(c.status ?? "Aktiv");
  }

  async function loadCompany() {
    setIsLoading(true);
    setError(null);

    try {
      const loadedCompany = await getCompanyById(companyId);
      setCompany(loadedCompany);
      fillForm(loadedCompany);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unternehmen konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCompany();
  }, [companyId]);

  if (isLoading) {
    return (
        <div className="formCard">
          <p className="muted">Unternehmen wird geladen...</p>
        </div>
    );
  }

  if (!company) {
    return (
        <>
          <h2>Unternehmen nicht gefunden</h2>
          <p className="error">{error}</p>
          <button className="btn btnPrimary" onClick={() => router.push("/companies")}>
            Zurück zur Liste
          </button>
        </>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!company) return;

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedShortDescription = shortDescription.trim();
    const normalizedWebsite = normalizeWebsite(website);

    if (!trimmedName) return setError("Bitte Name des Unternehmens eingeben.");
    if (!trimmedDesc) return setError("Bitte kurze Beschreibung eingeben.");
    if (!trimmedShortDescription) return setError("Bitte Kurzbeschreibung eingeben.");
    if (!normalizedWebsite) return setError("Bitte Website eingeben.");
    if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website-URL eingeben.");

    try {
      await updateCompany(company.id, {
        name: trimmedName,
        description: trimmedDesc,
        short_description: trimmedShortDescription,
        website: normalizedWebsite,
        active: status === "Aktiv",
      });

      if (logoFile) {
        await uploadCompanyLogo(company.id, logoFile);
      }

      if (imageFile) {
        await uploadCompanyImage(company.id, imageFile);
      }

      setLogoFile(null);
      setImageFile(null);

      router.push("/companies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  return (
    <div className="formCard profileEdit">
      <div className="formHeader">
        <div>
          <h2 style={{ margin: 0 }}>Unternehmensprofil bearbeiten</h2>
        </div>

        {/*<button className="btn btnGhost" onClick={() => router.push("/companies")}>*/}
        {/*  Zurück*/}
        {/*</button>*/}
      </div>

      <form onSubmit={onSave}>
        <div className="formGrid">
          <label className="field">
            <span>Name des Unternehmens *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as CompanyStatus)}>
              <option value="Aktiv">Aktiv</option>
              <option value="Inaktiv">Inaktiv</option>
            </select>
          </label>

          <label className="field formFull">
            <span>Kurzbeschreibung *</span>
            <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Unternehmens"
            />
          </label>

          <label className="field formFull">
            <span>Beschreibung *</span>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
            />
          </label>

          <label className="field formFull">
            <span>Webseite *</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </label>

          <label className="field uploadField">
            <span>Logo hochladen</span>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="field uploadField">
            <span>Unternehmensbild hochladen</span>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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