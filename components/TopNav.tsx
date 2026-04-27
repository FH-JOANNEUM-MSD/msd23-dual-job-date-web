"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Unternehmen" },
  { href: "/students", label: "Studierende" },
  { href: "/events", label: "Termine" },
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