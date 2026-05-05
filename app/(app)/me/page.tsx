"use client";

import React, {useEffect, useState} from "react";
import {getCurrentUser} from "@/lib/authApi";
import {getCompanyById, updateCompany, type Company, type CompanyStatus} from "@/lib/companiesApi";

function normalizeWebsite(input: string) {
    const value = input.trim();
    if (!value) return "";
    if (!/^https?:\/\//i.test(value)) return `https://${value}`;
    return value;
}

function isValidUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export default function MyCompanyProfilePage() {
    const [company, setCompany] = useState<Company | null>(null);
    const [mode, setMode] = useState<"view" | "edit">("view");

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [status, setStatus] = useState<CompanyStatus>("Aktiv");

    function fillForm(c: Company) {
        setName(c.name ?? "");
        setDescription(c.description ?? "");
        setWebsite(c.website ?? "");
        setStatus(c.status ?? "Aktiv");
    }

    async function loadProfile() {
        setIsLoading(true);
        setError(null);
        setInfo(null);

        try {
            const me = await getCurrentUser();

            const companyId = me.company_id ?? me.companyId;

            if (!companyId) {
                setError("Für diesen Account wurde keine company_id gefunden.");
                return;
            }

            const ownCompany = await getCompanyById(String(companyId));

            setCompany(ownCompany);
            fillForm(ownCompany);
            setMode("view");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unternehmensprofil konnte nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadProfile();
    }, []);

    function startEdit() {
        if (!company) return;
        fillForm(company);
        setError(null);
        setInfo(null);
        setMode("edit");
    }

    function cancelEdit() {
        if (company) fillForm(company);
        setError(null);
        setMode("view");
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;

        setError(null);
        setInfo(null);

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        const normalizedWebsite = normalizeWebsite(website);

        if (!trimmedName) return setError("Bitte Unternehmensname eingeben.");
        if (!trimmedDescription) return setError("Bitte Beschreibung eingeben.");
        if (!normalizedWebsite) return setError("Bitte Website eingeben.");
        if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website eingeben.");

        try {
            await updateCompany(company.id, {
                name: trimmedName,
                description: trimmedDescription,
                website: normalizedWebsite,
                active: status === "Aktiv",
            });

            const updatedCompany = await getCompanyById(company.id);

            setCompany(updatedCompany);
            fillForm(updatedCompany);
            setMode("view");
            setInfo("Unternehmensprofil wurde erfolgreich gespeichert.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
        }
    }

    if (isLoading) {
        return <p className="muted">Profil wird geladen...</p>;
    }

    if (!company) {
        return (
            <div className="card">
                <p className="error">{error}</p>
                <button className="btn btnPrimary" onClick={() => void loadProfile()}>
                    Erneut versuchen
                </button>
            </div>
        );
    }

    if (mode === "view") {
        return (
            <div className="formCard">
                <div className="formHeader">
                    <div>
                        <h2 style={{ margin: 0 }}>Mein Unternehmensprofil</h2>
                    </div>

                    <button className="btn btnPrimary" onClick={startEdit}>
                        Profil bearbeiten
                    </button>
                </div>

                {info && <p>{info}</p>}

                <div className="formGrid">
                    <div className="field">
                        <span>Name des Unternehmens</span>
                        <p>{company.name}</p>
                    </div>

                    <div className="field">
                        <span>Status</span>
                        <p>{company.status}</p>
                    </div>

                    <div className="field formFull">
                        <span>Beschreibung</span>
                        <p>{company.description || "Nicht angegeben"}</p>
                    </div>

                    <div className="field">
                        <span>Website</span>
                        {company.website ? (
                            <a href={company.website} target="_blank" rel="noreferrer">
                                {company.website}
                            </a>
                        ) : (
                            <p>Nicht angegeben</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="formCard">
            <div className="formHeader">
                <div>
                    <h2 style={{ margin: 0 }}>Unternehmensprofil bearbeiten</h2>
                </div>
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
                        <span>Beschreibung *</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                        />
                    </label>

                    <label className="field">
                        <span>Website *</span>
                        <input value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </label>
                </div>

                {error && <p className="error">{error}</p>}

                <div className="formFooter">
                    <button type="button" className="btn" onClick={cancelEdit}>
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