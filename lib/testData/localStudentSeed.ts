import type { Student } from "@/lib/studentsApi";
import { TEST_STUDENTS } from "./testStudents";

const STORAGE_KEY = "seed_test_students_v1";

export function loadSeedStudents(): Student[] {
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

export function saveSeedStudents(students: Student[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

export function seedTestStudents() {
  saveSeedStudents(TEST_STUDENTS);
}

export function clearSeedStudents() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}