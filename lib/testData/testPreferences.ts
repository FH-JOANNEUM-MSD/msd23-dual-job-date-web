import type { Company } from "@/lib/companiesApi";
import type { Student } from "@/lib/studentsApi";

export type PreferenceType = "like" | "neutral" | "dislike";

export type Preference = {
  id: string;
  student_id: string;
  company_id: string;
  preference_type: PreferenceType;
};

function isSeedStudent(student: Student) {
  return (
    student.id.startsWith("test-student-") ||
    student.email.endsWith("@test.local")
  );
}

export function buildSeedPreferences(
  students: Student[],
  companies: Company[]
): Preference[] {
  const seedStudents = students.filter(isSeedStudent);
  const activeCompanies = companies.filter((c) => c.status === "Aktiv");

  if (seedStudents.length === 0 || activeCompanies.length === 0) {
    return [];
  }

  const preferences: Preference[] = [];

  seedStudents.forEach((student, studentIndex) => {
    const companyCount = activeCompanies.length;

    const like1 = studentIndex % companyCount;
    const like2 = companyCount > 1 ? (studentIndex + 1) % companyCount : -1;
    const dislike = companyCount > 2 ? (studentIndex + 2) % companyCount : -1;

    activeCompanies.forEach((company, companyIndex) => {
      let preferenceType: PreferenceType = "neutral";

      if (companyIndex === like1 || companyIndex === like2) {
        preferenceType = "like";
      } else if (companyIndex === dislike) {
        preferenceType = "dislike";
      }

      preferences.push({
        id: `test-pref-${student.id}-${company.id}`,
        student_id: student.id,
        company_id: company.id,
        preference_type: preferenceType,
      });
    });
  });

  return preferences;
}