"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/authApi";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseClient();

        if (!supabase) {
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session?.access_token) {
          localStorage.removeItem("user_role");
          localStorage.removeItem("access_token");
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        const me = await getCurrentUser();
        const role = me.role ?? "";

        localStorage.setItem("user_role", role);

        const adminOnlyPaths = ["/dashboard", "/companies", "/students", "/events", "/preferences"];
        const companyOnlyPaths = ["/me"];

        const isAdminOnlyPath = adminOnlyPaths.some((path) =>
            pathname.startsWith(path)
        );

        const isCompanyOnlyPath = companyOnlyPaths.some((path) =>
            pathname.startsWith(path)
        );

        if (role === "company" && isAdminOnlyPath) {
          setIsAuthorized(false);
          router.replace("/me");
          return;
        }

        if (role !== "company" && isCompanyOnlyPath) {
          setIsAuthorized(false);
          router.replace("/dashboard");
          return;
        }

        setIsAuthorized(true);
      } catch {
        localStorage.removeItem("user_role");
        localStorage.removeItem("access_token");
        setIsAuthorized(false);
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    }

    void checkAuth();
  }, [router, pathname]);

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