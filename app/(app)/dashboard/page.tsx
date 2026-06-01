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
          <p>Liste ansehen, einladen und bearbeiten.</p>
          <Link href="/companies">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Studierende</h3>
          <p>Liste ansehen, einladen und bearbeiten.</p>
          <Link href="/students">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Termine</h3>
          <p>Job-Dating Termine verwalten.</p>
          <Link href="/events">Öffnen</Link>
        </div>

        <div className="card">
          <h3>Präferenzen</h3>
          <p>Likes und Dislikes von Studierenden einsehen.</p>
          <Link href="/preferences">Öffnen</Link>
        </div>
      </div>
    </>
  );
}