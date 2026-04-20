"use client";

import type { Company } from "@/lib/companiesApi";
import type { Student } from "@/lib/studentsApi";
import { buildSeedPreferences, type Preference } from "./testPreferences";

const STORAGE_KEY = "seed_test_preferences_v1";

export function loadSeedPreferences(): Preference[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeedPreferences(preferences: Preference[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function seedTestPreferences(students: Student[], companies: Company[]) {
  const preferences = buildSeedPreferences(students, companies);
  saveSeedPreferences(preferences);
  return preferences;
}

export function clearSeedPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}