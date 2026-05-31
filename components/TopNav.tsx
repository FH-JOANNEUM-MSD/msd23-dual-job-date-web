"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Unternehmen" },
  { href: "/students", label: "Studierende" },
  { href: "/events", label: "Termine" },
  { href: "/me", label: "Mein Profil" },
  { href: "/login", label: "Logout" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}


export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") ?? "";
    setRole(storedRole);
  }, []);

  const isCompany = role === "company";

  async function handleLogout(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const supabase = getSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem("user_role");
    localStorage.removeItem("access_token");

    router.push("/login");
  }

  return (
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <Image
                className="logo"
                src="/IIT_RGB.png"
                alt="FH JOANNEUM Logo"
                width={212}
                height={112}
                priority
            />
            <div>
              <h1>Dual Job Dating</h1>
              <p>Web-Portal</p>
            </div>
          </div>

          <nav className="nav">
            {!isCompany && (
                <>
                  <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
                    Dashboard
                  </Link>

                  <Link href="/companies" className={pathname === "/companies" ? "active" : ""}>
                    Unternehmen
                  </Link>

                  <Link href="/students" className={pathname === "/students" ? "active" : ""}>
                    Studierende
                  </Link>

                  <Link href="/events" className={pathname === "/events" ? "active" : ""}>
                    Termine
                  </Link>

                  <Link href="/preferences" className={pathname === "/preferences" ? "active" : ""}>
                    Präferenzen
                  </Link>
                </>
            )}

            {isCompany && (
                <Link href="/me" className={pathname === "/me" ? "active" : ""}>
                  Mein Profil
                </Link>
            )}

            <Link href="/login" onClick={handleLogout}>
              Logout
            </Link>
          </nav>
        </div>
      </header>
  );
}