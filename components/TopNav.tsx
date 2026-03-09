"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Unternehmen" },
  { href: "/students", label: "Studenten" },
  { href: "/login", label: "Logout" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div>
            <h1>Dual Job Dating</h1>
            <p>Web-Portal</p>
          </div>
        </div>

        <nav className="nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(pathname, l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}