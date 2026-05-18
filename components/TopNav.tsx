"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") ?? "";
    setRole(storedRole);
  }, []);

  const isCompany = role === "company";

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
          {/* ADMIN NAV */}
          {!isCompany && (
              <>
                <Link href="/dashboard" className={isActive(pathname, "/dashboard") ? "active" : ""}>
                  Dashboard
                </Link>
                <Link href="/companies" className={isActive(pathname, "/companies") ? "active" : ""}>
                  Unternehmen
                </Link>
                <Link href="/students" className={isActive(pathname, "/students") ? "active" : ""}>
                  Studierende
                </Link>
                <Link href="/events" className={isActive(pathname, "/events") ? "active" : ""}>
                  Termine
                </Link>
                {role === "admin" && (
                  <Link
                    href="/preferences"
                    className={isActive(pathname, "/preferences") ? "active" : ""}
                  >
                    Präferenzen
                  </Link>
                )}
              </>
          )}

          {/* COMPANY NAV */}
          {isCompany && (
              <Link href="/me" className={isActive(pathname, "/me") ? "active" : ""}>
                Mein Profil
              </Link>
          )}

          {/* LOGOUT */}
          <Link
              href="/login"
              onClick={() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user_role");
              }}
          >
            Logout
          </Link>
        </nav>
      </div>
    </header>
  );
}