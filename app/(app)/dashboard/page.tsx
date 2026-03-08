import Link from "next/link";

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
      </div>
    </>
  );
}