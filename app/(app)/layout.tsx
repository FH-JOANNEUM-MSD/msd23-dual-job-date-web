"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseClient();

        if (supabase) {
          const { data, error } = await supabase.auth.getSession();

          if (!error && data.session?.access_token) {
            setIsAuthorized(true);
            setCheckingAuth(false);
            return;
          }
        }

        const fallbackToken =
          typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (fallbackToken) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          router.replace("/login");
        }
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="main">
        <p>Lade...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <TopNav />
      <main className="main">{children}</main>
    </>
  );
}