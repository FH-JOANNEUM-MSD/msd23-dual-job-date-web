"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase ist nicht konfiguriert (.env).");
        return;
      }

      const {data, error} = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || "Login fehlgeschlagen.");
        return;
      }

      const token = data.session?.access_token;

      if (!token) {
        setError("Kein Access Token von Supabase erhalten.");
        return;
      }

      localStorage.setItem("access_token", token);
      setError("");
      router.push("/dashboard");
    }catch (err) {
      setError("Fehler beim Login.");
    } finally {
      setIsSubmitting(false);
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
            <label htmlFor="email">E-Mail</label>
            <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
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
              placeholder="Passwort"
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