"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: any) {
    event.preventDefault();

    // TODO: Replace hardcoded credentials with real authentication against the databank.
    if (username === "admin" && password === "admin") {
      setError("");
      router.push("/dashboard");
    } else {
      setError("Falscher Login oder Passwort.");
    }
  }

  return (
    <main className="main">
      <div className="formCard">
        <div className="formHeader">
          <div>
            <h2>Login</h2>
            <p className="muted">
              Melden Sie sich mit Ihren Zugangsdaten an.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="formGrid">
          <div className="field formFull">
            <label htmlFor="username">Login</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="field formFull">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin"
            />
          </div>

          {error && (
            <p className="error formFull" aria-live="polite">
              {error}
            </p>
          )}

          <div className="formFooter formFull">
            <button type="submit" className="btn btnPrimary">
              Einloggen
            </button>
            <Link href="/" className="btn btnGhost">
              Zurück zur Startseite
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}