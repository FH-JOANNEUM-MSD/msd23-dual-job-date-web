"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type MessageState = {
  text: string;
  color: string;
};

function validatePassword(password: string): string[] {
  const missing: string[] = [];

  if (password.length < 8) missing.push("mind. 8 Zeichen");
  if (!/[A-Z]/.test(password)) missing.push("ein Großbuchstabe");
  if (!/[a-z]/.test(password)) missing.push("ein Kleinbuchstabe");
  if (!/[0-9]/.test(password)) missing.push("eine Zahl");
  if (!/[^a-zA-Z0-9]/.test(password)) missing.push("ein Sonderzeichen");

  return missing;
}

export default function SetPasswordPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState<MessageState>({ text: "", color: "#64748b" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function initializeAuthFromUrl() {
      if (!supabase) {
        setMessage({
          text: "Supabase ist nicht konfiguriert.",
          color: "#ef4444",
        });
        return;
      }

      try {
        // Case 1: Supabase invite/recovery flow via ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage({
              text: `Einladungslink konnte nicht verarbeitet werden: ${error.message}`,
              color: "#ef4444",
            });
            return;
          }
        }

        // Case 2: Session already detected from hash fragment / prior init
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setMessage({
            text: `Sitzung konnte nicht geladen werden: ${error.message}`,
            color: "#ef4444",
          });
          return;
        }

        if (!data.session) {
          setMessage({
            text: "Kein gültiger Einladungslink oder die Sitzung ist abgelaufen.",
            color: "#ef4444",
          });
          return;
        }

        setIsReady(true);
      } catch (error) {
        const text =
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Initialisieren der Einladung.";
        setMessage({
          text,
          color: "#ef4444",
        });
      }
    }

    void initializeAuthFromUrl();
  }, [supabase]);

  async function handleSubmit() {
    if (!supabase) {
      setMessage({
        text: "Supabase ist nicht konfiguriert.",
        color: "#ef4444",
      });
      return;
    }

    const missingRules = validatePassword(password1);

    if (missingRules.length > 0) {
      setMessage({
        text: `Passwort zu schwach! Es fehlt: ${missingRules.join(", ")}.`,
        color: "#ef4444",
      });
      return;
    }

    if (password1 !== password2) {
      setMessage({
        text: "Die Passwörter stimmen nicht überein!",
        color: "#ef4444",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({
        text: "Speichere Passwort...",
        color: "#4F46E5",
      });

      const { error } = await supabase.auth.updateUser({
        password: password1,
      });

      if (error) {
        setMessage({
          text: `Fehler: ${error.message}`,
          color: "#ef4444",
        });
        return;
      }

      setSuccess(true);
      setMessage({
        text: "",
        color: "#64748b",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openApp() {
    window.location.href = "dualJobDating://invite";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#f8fafc",
      }}
    >
      {!success ? (
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "40px 30px",
            borderRadius: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Willkommen!</h1>
          <p className="muted" style={{ marginBottom: 32, lineHeight: 1.6 }}>
            Setze dein Passwort, um die Registrierung für <b>Dual Job Dating</b> abzuschließen.
          </p>

          <input
            type="password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            placeholder="Neues Passwort"
            disabled={!isReady || isSubmitting}
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 16,
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 16,
            }}
          />

          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Passwort wiederholen"
            disabled={!isReady || isSubmitting}
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 16,
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 16,
            }}
          />

          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => void handleSubmit()}
            disabled={!isReady || isSubmitting}
            style={{ width: "100%" }}
          >
            {isSubmitting ? "Wird gespeichert..." : "Passwort speichern"}
          </button>

          <p
            style={{
              marginTop: 16,
              minHeight: 20,
              fontSize: 14,
              fontWeight: 500,
              color: message.color,
            }}
          >
            {message.text}
          </p>
        </div>
      ) : (
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "40px 30px",
            borderRadius: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Alles fertig!</h1>
          <p className="muted" style={{ marginBottom: 32, lineHeight: 1.6 }}>
            Dein Passwort wurde gespeichert. Du kannst dich jetzt in der App einloggen.
          </p>

          <button
            type="button"
            className="btn btnPrimary"
            onClick={openApp}
            style={{ width: "100%" }}
          >
            Zur App wechseln
          </button>
        </div>
      )}
    </main>
  );
}