import { render, screen } from "@testing-library/react";
import PreferencesPage from "@/app/(app)/preferences/page";
import { getCurrentUser } from "@/lib/authApi";
import { getAllPreferences } from "@/lib/preferencesApi";
import { getCompanies } from "@/lib/companiesApi";
import { getStudents } from "@/lib/studentsApi";

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
    }),
    usePathname: () => "/preferences",
    useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/authApi", () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/preferencesApi", () => ({
    getAllPreferences: jest.fn(),

    buildPreferenceMap: jest.fn((preferences) => {
        const map = new Map();

        preferences.forEach((pref: any) => {
            map.set(`${pref.studentId}::${pref.companyId}`, pref.preferenceType);
        });

        return map;
    }),

    preferenceKey: jest.fn((studentId: string, companyId: string) => {
        return `${studentId}::${companyId}`;
    }),
}));

jest.mock("@/lib/companiesApi", () => ({
    getCompanies: jest.fn(),
}));

jest.mock("@/lib/studentsApi", () => ({
    getStudents: jest.fn(),
}));

describe("PreferencesPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.setItem("user_role", "admin");

        (getCurrentUser as jest.Mock).mockResolvedValue({
            role: "admin",
        });

        (getStudents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Sansa Stark",
                studyProgram: "Dragon Management",
                semester: 2,
            },
        ]);

        (getCompanies as jest.Mock).mockResolvedValue([
            {
                id: "6",
                userId: "user-6",
                name: "Winterfell Logistics",
                description: "Winter is coming.",
                shortDescription: "Logistics",
                website: "https://winterfell.net",
                status: "Aktiv",
                active: true,
            },
        ]);

        (getAllPreferences as jest.Mock).mockResolvedValue([
            {
                id: "1",
                studentId: "1",
                companyId: "6",
                preferenceType: "like",
            },
        ]);
    });

    afterEach(() => {
        window.localStorage.clear();
    });


    test("should load preferences", async () => {
        render(<PreferencesPage />);

        expect(await screen.findByText("Sansa Stark")).toBeInTheDocument();
        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
    });


    test("should display like preference", async () => {
        render(<PreferencesPage />);

        expect(await screen.findByText("↑ Like")).toBeInTheDocument();
        expect(screen.getByText("↓ Dislike")).toBeInTheDocument();
        expect(screen.getByText("— Offen")).toBeInTheDocument();
    });
});