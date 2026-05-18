"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/authApi";
import { getCompanies, type Company } from "@/lib/companiesApi";
import {
    buildPreferenceMap,
    getAllPreferences,
    type Preference,
    type PreferenceType,
} from "@/lib/preferencesApi";
import { getStudents, type Student } from "@/lib/studentsApi";

const PREFERENCE_LABELS: Record<PreferenceType, string> = {
    like: "Like",
    dislike: "Dislike",
    none: "Offen",
};

function PreferenceCell({ type }: { type: PreferenceType }) {
    return (
        <span className={`prefCell prefCell--${type}`} title={PREFERENCE_LABELS[type]}>
            {type === "like" && "↑"}
            {type === "dislike" && "↓"}
            {type === "none" && "—"}
        </span>
    );
}

export default function PreferencesPage() {
    const router = useRouter();

    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [studyProgramFilter, setStudyProgramFilter] = useState("");
    const [hideOpen, setHideOpen] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const me = await getCurrentUser();
                const role = me.role ?? localStorage.getItem("user_role") ?? "";

                if (role !== "admin") {
                    setAuthorized(false);
                    return;
                }

                setAuthorized(true);

                const [studentsData, companiesData, preferencesData] = await Promise.all([
                    getStudents(),
                    getCompanies(),
                    getAllPreferences(),
                ]);

                setStudents(studentsData);
                setCompanies(companiesData);
                setPreferences(preferencesData);
            } catch (err) {
                const message =
                    err instanceof ApiError
                        ? err.message
                        : "Präferenzen konnten nicht geladen werden.";
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        void init();
    }, []);

    const prefMap = useMemo(() => buildPreferenceMap(preferences), [preferences]);

    const studyPrograms = useMemo(() => {
        return [...new Set(students.map((s) => s.studyProgram).filter(Boolean))].sort();
    }, [students]);

    const activeCompanies = useMemo(() => {
        return [...companies]
            .filter((c) => c.status === "Aktiv")
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [companies]);

    const visibleStudents = useMemo(() => {
        return [...students]
            .filter((s) => {
                if (studyProgramFilter && s.studyProgram !== studyProgramFilter) return false;
                if (!hideOpen) return true;

                return activeCompanies.some((company) => {
                    const type = prefMap.get(`${s.id}::${company.id}`) ?? "none";
                    return type !== "none";
                });
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, studyProgramFilter, hideOpen, activeCompanies, prefMap]);

    const stats = useMemo(() => {
        let like = 0;
        let dislike = 0;
        let none = 0;

        preferences.forEach((pref) => {
            if (pref.preferenceType === "like") like += 1;
            else if (pref.preferenceType === "dislike") dislike += 1;
            else none += 1;
        });

        return { like, dislike, none, total: preferences.length };
    }, [preferences]);

    if (authorized === false) {
        return (
            <>
                <div className="pageHeader">
                    <h2 style={{ margin: 0 }}>Präferenzen</h2>
                </div>
                <p className="error">Nur Administratoren haben Zugriff auf diese Seite.</p>
                <button type="button" className="btn btnPrimary" onClick={() => router.push("/dashboard")}>
                    Zum Dashboard
                </button>
            </>
        );
    }

    return (
        <>
            <div className="pageHeader">
                <div>
                    <h2 style={{ margin: 0 }}>Präferenzen</h2>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                        Übersicht: welche Studierenden welches Unternehmen geliked oder disliked haben.
                    </p>
                </div>
            </div>

            <div className="formCard" style={{ marginBottom: 16, maxWidth: "none" }}>
                <div className="formGrid">
                    <label className="field">
                        <span>Akademisches Programm</span>
                        <select
                            value={studyProgramFilter}
                            onChange={(e) => setStudyProgramFilter(e.target.value)}
                        >
                            <option value="">Alle Programme</option>
                            {studyPrograms.map((program) => (
                                <option key={program} value={program}>
                                    {program}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field" style={{ justifyContent: "flex-end" }}>
                        <span>Ansicht</span>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={hideOpen}
                                onChange={(e) => setHideOpen(e.target.checked)}
                            />
                            Nur Studierende mit mindestens einer Auswahl
                        </label>
                    </label>
                </div>

                <p className="muted" style={{ margin: "12px 0 0" }}>
                    {stats.total} Einträge · {stats.like} Likes · {stats.dislike} Dislikes · {stats.none}{" "}
                    noch offen
                </p>

                <div className="prefLegend" style={{ marginTop: 12 }}>
                    <span className="prefCell prefCell--like">↑ Like</span>
                    <span className="prefCell prefCell--dislike">↓ Dislike</span>
                    <span className="prefCell prefCell--none">— Offen</span>
                </div>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="tableWrap prefTableWrap">
                <table className="table prefTable">
                    <thead>
                        <tr>
                            <th className="prefStickyCol">Studierende</th>
                            {activeCompanies.map((company) => (
                                <th key={company.id} className="prefCompanyCol" title={company.name}>
                                    {company.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={activeCompanies.length + 1}>Lade Präferenzen…</td>
                            </tr>
                        ) : visibleStudents.length === 0 ? (
                            <tr>
                                <td colSpan={activeCompanies.length + 1}>
                                    Keine Studierenden für diese Filter gefunden.
                                </td>
                            </tr>
                        ) : (
                            visibleStudents.map((student) => (
                                <tr key={student.id}>
                                    <th className="prefStickyCol" scope="row">
                                        {student.name}
                                        <span className="muted prefStudentMeta">
                                            {student.studyProgram}
                                            {student.semester != null ? ` · S${student.semester}` : ""}
                                        </span>
                                    </th>
                                    {activeCompanies.map((company) => {
                                        const type = prefMap.get(`${student.id}::${company.id}`) ?? "none";
                                        return (
                                            <td key={company.id} className="prefDataCell">
                                                <PreferenceCell type={type} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
