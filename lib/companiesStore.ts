// lib/companiesStore.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type CompanyStatus = "Aktiv" | "Inaktiv";

export type Company = {
  id: string;
  name: string;
  description: string;       // edited on profile page (not shown in table)
  program: string;
  industry: string;          // Branche
  website: string;
  status: CompanyStatus;

  // optional for later (matches your screenshot-style form)
  locations?: string;
  jobDescription?: string;
};

const STORAGE_KEY = "mock_companies_v1";
const DEFAULT_PROGRAM = "Mobile Software Development";

const seedCompanies: Company[] = [
  {
    id: "c1",
    name: "Test AG",
    description: "Ein Beispielunternehmen für Demo-Zwecke.",
    program: DEFAULT_PROGRAM,
    industry: "IT",
    website: "https://www.fh-joanneum.at",
    status: "Aktiv",
    locations: "",
    jobDescription: "",
  },
  {
    id: "c2",
    name: "Test2 AG",
    description: "Noch ein Unternehmen. Beschreibung wird in der Profilansicht bearbeitet.",
    program: DEFAULT_PROGRAM,
    industry: "IT",
    website: "https://www.fh-joanneum.at",
    status: "Aktiv",
    locations: "",
    jobDescription: "",
  },
];

function safeRead(): Company[] {
  if (typeof window === "undefined") return seedCompanies;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCompanies;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedCompanies;
    return parsed as Company[];
  } catch {
    return seedCompanies;
  }
}

function safeWrite(companies: Company[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

export function useCompaniesStore() {
  const [companies, setCompanies] = useState<Company[]>(() => safeRead());

  useEffect(() => {
    safeWrite(companies);
  }, [companies]);

  const api = useMemo(() => {
    return {
      companies,

      getById(id: string) {
        return companies.find((c) => c.id === id) ?? null;
      },

      add(company: Company) {
        setCompanies((prev) => [company, ...prev]);
      },

      update(id: string, patch: Partial<Company>) {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      },

      remove(id: string) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
      },
    };
  }, [companies]);

  return api;
}

export const DEFAULT_COMPANY_PROGRAM = DEFAULT_PROGRAM;