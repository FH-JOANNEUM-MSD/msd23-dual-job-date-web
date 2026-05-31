"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/authApi";


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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || "Login fehlgeschlagen.");
        return;
      }

      if (!data.session?.access_token) {
        setError("Kein Access Token von Supabase erhalten.");
        return;
      }

      const me = await getCurrentUser();

      localStorage.setItem("user_role", me.role ?? "");

      if (me.role === "company") {
        router.push("/me");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Fehler beim Login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="main"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 32,
        paddingBottom: 32,
      }}
    >
      <div
        className="formCard"
        style={{
          width: "100%",
          maxWidth: 520,
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Image
            src="/fh-joanneum-logo.jpg"
            alt="FH Joanneum Logo"
            width={260}
            height={80}
            style={{ height: "auto", width: "auto", maxWidth: "100%" }}
            priority
          />
        </div>

        <div className="formHeader" style={{ marginBottom: 20 }}>
          <div style={{ width: "100%", textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                color: "var(--green)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Dual Job Dating
            </p>
            <h2 style={{ margin: "8px 0 8px" }}>Web-Portal Login</h2>
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
            <button type="submit" className="btn btnPrimary" disabled={isSubmitting}>
              {isSubmitting ? "Einloggen..." : "Einloggen"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}