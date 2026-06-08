"use client";

import React, {useEffect, useState} from "react";
import {getCurrentUser} from "@/lib/authApi";
import {getCompanyById, updateCompany, uploadCompanyLogo, uploadCompanyImage, type Company, type CompanyStatus} from "@/lib/companiesApi";

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

    const [shortDescription, setShortDescription] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    function fillForm(c: Company) {
        setName(c.name ?? "");
        setShortDescription(c.shortDescription ?? "");
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

    async function removeLogo() {
        if (!company) return;

        try {
            await updateCompany(company.id, {
                logo_url: "",
            });

            const updatedCompany = await getCompanyById(company.id);
            setCompany(updatedCompany);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Logo konnte nicht entfernt werden.");
        }
    }

    async function removeImage(imageUrl: string) {
        if (!company) return;

        const remainingImages = company.imageUrls.filter((url) => url !== imageUrl);

        try {
            await updateCompany(company.id, {
                image_urls: remainingImages.join(";"),
            });

            const updatedCompany = await getCompanyById(company.id);

            setCompany(updatedCompany);
            fillForm(updatedCompany);
            setInfo("Bild wurde entfernt.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bild konnte nicht entfernt werden.");
        }
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;

        setError(null);
        setInfo(null);

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        const trimmedShortDescription = shortDescription.trim();
        const normalizedWebsite = normalizeWebsite(website);

        if (!trimmedName) return setError("Bitte Unternehmensname eingeben.");
        if (!trimmedShortDescription) return setError("Bitte Kurzbeschreibung eingeben.");
        if (!trimmedDescription) return setError("Bitte Beschreibung eingeben.");
        if (!normalizedWebsite) return setError("Bitte Website eingeben.");
        if (!isValidUrl(normalizedWebsite)) return setError("Bitte eine gültige Website eingeben.");

        try {
            await updateCompany(company.id, {
                name: trimmedName,
                short_description: trimmedShortDescription,
                description: trimmedDescription,
                website: normalizedWebsite,
                active: status === "Aktiv",
            });

            if (logoFile) {
                await uploadCompanyLogo(company.id, logoFile);
            }

            if (imageFile) {
                await uploadCompanyImage(company.id, imageFile);
            }

            const updatedCompany = await getCompanyById(company.id);

            setCompany(updatedCompany);
            fillForm(updatedCompany);
            setLogoFile(null);
            setImageFile(null);
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
            <div className="formCard profileView">
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
                        <p
                            className={`profileStatus ${
                                company.status === "Aktiv"
                                    ? "profileStatusActive"
                                    : "profileStatusInactive"
                            }`}
                        >
                            {company.status === "Aktiv"
                                ? "Teilnahme am Jobdating"
                                : "Keine Teilnahme am Jobdating"}
                        </p>
                    </div>

                    <div className="field formFull">
                        <span>Beschreibung</span>
                        <p>{company.description || "Nicht angegeben"}</p>
                    </div>

                    <div className="field formFull">
                        <span>Kurzbeschreibung</span>
                        <p>{company.shortDescription || "Nicht angegeben"}</p>
                    </div>

                    <div className="field formFull">
                        <span>Logo</span>

                        {company.logoUrl ? (
                            <div
                                style={{
                                    position: "relative",
                                    width: 170,
                                    height: 100,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    border: "1px solid var(--border)",
                                    background: "#f8fafc",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 8,
                                }}
                            >
                                <img
                                    src={company.logoUrl}
                                    alt={`${company.name} Logo`}
                                    onError={(e) => {
                                        e.currentTarget.replaceWith(
                                            Object.assign(document.createElement("p"), {
                                                textContent: "Logo konnte nicht geladen werden.",
                                            })
                                        );
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                    }}
                                />

                                <button
                                    type="button"
                                    title="Logo entfernen"
                                    onClick={() => void removeLogo()}
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        border: "1px solid #d1d5db",
                                        background: "white",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        padding: 0,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ) : (
                            <p>Nicht angegeben</p>
                        )}
                    </div>

                    <div className="field formFull">
                        <span>Bilder</span>

                        {company.imageUrls.length > 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    marginTop: 8,
                                    alignItems: "flex-start",
                                }}
                            >
                                {company.imageUrls.map((url) => (
                                    <div
                                        key={url}
                                        style={{
                                            position: "relative",
                                            width: 200,
                                            height: 120,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            border: "1px solid var(--border)",
                                            background: "#f8fafc",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`${company.name} Bild`}
                                            onError={(e) => {
                                                e.currentTarget.replaceWith(
                                                    Object.assign(document.createElement("p"), {
                                                        textContent: "Bild konnte nicht geladen werden.",
                                                    })
                                                );
                                            }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />

                                        <button
                                            type="button"
                                            title="Bild entfernen"
                                            onClick={() => void removeImage(url)}
                                            style={{
                                                position: "absolute",
                                                top: 6,
                                                right: 6,
                                                width: 28,
                                                height: 28,
                                                borderRadius: "50%",
                                                border: "1px solid #d1d5db",
                                                background: "white",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 11,
                                                padding: 0,
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Nicht angegeben</p>
                        )}
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
        <div className="formCard profileEdit">
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
                            <option value="Aktiv">Teilnahme am Jobdating</option>
                            <option value="Inaktiv">Keine Teilnahme am Jobdating</option>
                        </select>
                    </label>

                    <label className="field formFull">
                        <span>Kurzbeschreibung *</span>
                        <input
                            maxLength={100}
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Kurze Beschreibung des Unternehmens"
                        />
                    </label>

                    <label className="field formFull">
                        <span>Beschreibung *</span>
                        <textarea
                            maxLength={500}
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