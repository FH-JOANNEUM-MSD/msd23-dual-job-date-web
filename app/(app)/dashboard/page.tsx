/*import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <h2>Dashboard</h2>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>
        Wähle einen Bereich aus, um Einträge zu verwalten.
      </p>

      <div className="cards">
        <div className="card">
          <h3>Unternehmen</h3>
          <p>Liste ansehen, hinzufügen, bearbeiten und löschen.</p>
          <Link href="/companies">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Studenten</h3>
          <p>Liste ansehen, hinzufügen, bearbeiten und löschen.</p>
          <Link href="/students">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Termine</h3>
          <p>Job-Dating Termine verwalten.</p>
          <Link href="/events">Öffnen</Link>
        </div>

      </div>
    </>
  );
}*/

// USE VERSION BELOW WHEN WORKING WITH TEST DATA | TODO: REMOVE LATER

"use client";

import Link from "next/link";
import { useState } from "react";
import { getStudents } from "@/lib/studentsApi";
import { getCompanies } from "@/lib/companiesApi";
import { seedTestStudents } from "@/lib/testData/localStudentSeed";
import { seedTestPreferences } from "@/lib/testData/localPreferenceSeed";

function isSeedStudentId(id: string) {
  return id.startsWith("test-student-");
}

export default function DashboardPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedInfo, setSeedInfo] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  async function initializeTestData() {
    try {
      setIsSeeding(true);
      setSeedError(null);
      setSeedInfo(null);

      // 1) put test students into localStorage
      seedTestStudents();

      // 2) fetch current students + companies from shared app layer
      // getStudents() should now include the seeded students as well
      const [students, companies] = await Promise.all([
        getStudents(),
        getCompanies(),
      ]);

      // 3) generate preferences against the real company IDs
      const preferences = seedTestPreferences(students, companies);

      // For debugging in browser console
      console.log("Generated test preferences:", preferences);

      const seededStudentCount = students.filter((s) => isSeedStudentId(s.id)).length;

      setSeedInfo(
        `${seededStudentCount} Test-Studenten und ${preferences.length} Test-Präferenzen wurden geladen.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Testdaten konnten nicht initialisiert werden.";
      setSeedError(message);
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <>
      <h2>Dashboard</h2>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>
        Wähle einen Bereich aus, um Einträge zu verwalten.
      </p>

      {seedError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>{seedError}</p>
        </div>
      )}

      {seedInfo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{seedInfo}</p>
        </div>
      )}

      <div className="cards">
        <div className="card">
          <h3>Unternehmen</h3>
          <p>Liste ansehen, hinzufügen, bearbeiten und löschen.</p>
          <Link href="/companies">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Studenten</h3>
          <p>Liste ansehen, hinzufügen, bearbeiten und löschen.</p>
          <Link href="/students">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Termine</h3>
          <p>Job-Dating Termine verwalten.</p>
          <Link href="/events">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Testdaten</h3>
          <p>
            Lädt lokale Test-Studenten und erzeugt passende Test-Präferenzen
            für die Matching-Logik.
          </p>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => void initializeTestData()}
            disabled={isSeeding}
          >
            {isSeeding ? "Lade..." : "Testdaten initialisieren"}
          </button>
        </div>
      </div>
    </>
  );
}