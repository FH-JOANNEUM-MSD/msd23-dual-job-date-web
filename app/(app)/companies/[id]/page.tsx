"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCompanyById, updateCompany, type Company } from "@/lib/companiesApi";

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const companyId = params.id;

    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadCompany() {
        setIsLoading(true);
        setError(null);

        try {
            const loadedCompany = await getCompanyById(companyId);
            setCompany(loadedCompany);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unternehmen konnte nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
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
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bild konnte nicht entfernt werden.");
        }
    }

    useEffect(() => {
        void loadCompany();
    }, [companyId]);

    if (isLoading) {
        return <p className="muted">Unternehmen wird geladen...</p>;
    }

    if (!company) {
        return (
            <div className="card">
                <p className="error">{error ?? "Unternehmen nicht gefunden."}</p>

                <button className="btn btnPrimary" onClick={() => router.push("/companies")}>
                    Zurück zur Liste
                </button>
            </div>
        );
    }

    return (
        <div className="formCard profileView">
            <div className="formHeader">
                <h2 style={{ margin: 0 }}>Unternehmensprofil</h2>

                <button className="btn" onClick={() => router.push("/companies")}>
                    Zurück
                </button>
            </div>

            {error && <p className="error">{error}</p>}

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
                        {company.status}
                    </p>
                </div>

                <div className="field formFull">
                    <span>Kurzbeschreibung</span>
                    <p>{company.shortDescription || "Nicht angegeben"}</p>
                </div>

                <div className="field formFull">
                    <span>Beschreibung</span>
                    <p>{company.description || "Nicht angegeben"}</p>
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