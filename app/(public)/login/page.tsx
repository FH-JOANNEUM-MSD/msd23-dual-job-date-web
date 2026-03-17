"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: any) {
    event.preventDefault();

    if (username === "unternehmen" && password === "unternehmen") {
      setError("");
      router.push("/companies/c1/edit");
      return;
    }

    if (username === "admin" && password === "admin") {
      setError("");
      router.push("/dashboard");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert (.env).");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });

    if (error || !data.session?.access_token) {
      setError(error?.message ?? "Falscher Login oder Passwort.");
      return;
    }

    localStorage.setItem("access_token", data.session.access_token);
    setError("");
    router.push("/dashboard");
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