import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EventsPage from "@/app/(app)/events/page";
import {
    getAllEvents,
    createEvent,
    deleteEvent,
} from "@/lib/eventsApi";
import {
    getAllMeetings,
    assignMeetings,
    saveEventMeetings,
} from "@/lib/meetingsApi";
import { getCompanies } from "@/lib/companiesApi";
import { getStudents } from "@/lib/studentsApi";
import { getAllPreferences } from "@/lib/preferencesApi";
import { getAllSlots, createSlot } from "@/lib/slotsApi";

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn() }),
    usePathname: () => "/events",
    useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/eventsApi", () => ({
    getAllEvents: jest.fn(),
    getActiveEvents: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
}));

jest.mock("@/lib/meetingsApi", () => ({
    getAllMeetings: jest.fn(),
    assignMeetings: jest.fn(),
    saveEventMeetings: jest.fn(),
}));

jest.mock("@/lib/companiesApi", () => ({ getCompanies: jest.fn() }));
jest.mock("@/lib/studentsApi", () => ({ getStudents: jest.fn() }));

jest.mock("@/lib/preferencesApi", () => ({
    getAllPreferences: jest.fn(),
    buildPreferenceMap: jest.fn((preferences) => {
        const map = new Map();
        preferences.forEach((pref: { studentId: string; companyId: string; preferenceType: string }) => {
            map.set(`${pref.studentId}::${pref.companyId}`, pref.preferenceType);
        });
        return map;
    }),
    preferenceKey: jest.fn((studentId: string, companyId: string) => `${studentId}::${companyId}`),
}));

jest.mock("@/lib/slotsApi", () => ({
    getAllSlots: jest.fn(),
    createSlot: jest.fn(),
    updateSlot: jest.fn(),
    deleteSlot: jest.fn(),
}));

describe("EventsPage (matrix + backend matching)", () => {
    beforeAll(() => {
        window.scrollTo = jest.fn();
        window.confirm = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (window.confirm as jest.Mock).mockReturnValue(true);

        (getStudents as jest.Mock).mockResolvedValue([
            { id: "1", name: "Sansa Stark", studyProgram: "Dragon Management", semester: 2 },
        ]);
        (getCompanies as jest.Mock).mockResolvedValue([
            { id: "6", name: "Winterfell Logistics", active: true, status: "Aktiv" },
        ]);
        (getAllPreferences as jest.Mock).mockResolvedValue([
            { id: "1", studentId: "1", companyId: "6", preferenceType: "like" },
        ]);
        (getAllEvents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Westeros Career Fair",
                eventDate: "2026-07-08",
                location: "King's Landing",
                description: "Akademisches Programm: Dragon Management; Semester: Alle Semester",
                isActive: true,
            },
        ]);
        (getAllMeetings as jest.Mock).mockResolvedValue([
            {
                id: "10", eventId: "1", slotId: "100",
                slotStartTime: "09:00:00", slotEndTime: "09:15:00",
                studentId: "1", studentName: "Sansa Stark", companyId: "6",
            },
        ]);
        // Two event-owned slots for event "1" -> the saved-event row must show "2".
        (getAllSlots as jest.Mock).mockResolvedValue([
            { id: "100", startTime: "09:00:00", endTime: "09:15:00", eventId: "1" },
            { id: "101", startTime: "09:15:00", endTime: "09:30:00", eventId: "1" },
        ]);
        (createSlot as jest.Mock).mockImplementation(({ startTime, endTime, eventId }) =>
            Promise.resolve({ id: `new-${startTime}`, startTime, endTime, eventId })
        );
        (createEvent as jest.Mock).mockResolvedValue({
            id: "2", name: "New Job Dating", eventDate: "2026-08-10", location: "",
            description: "Akademisches Programm: Dragon Management; Semester: Alle Semester", isActive: true,
        });
        (deleteEvent as jest.Mock).mockResolvedValue({ message: "deleted" });
        (assignMeetings as jest.Mock).mockResolvedValue({
            dryRun: true,
            plannedMeetings: [
                { slotId: "new-09:00:00", studentId: "1", companyId: "6", preferenceType: "like" },
            ],
            insertedMeetings: 0,
            summary: {
                totalCompanySlots: 6, generatedMeetings: 1, assignedLike: 1, assignedNeutral: 0,
                assignedDislike: 0, dislikeAvoidedSlots: 0, unassignedCompanySlots: 5,
            },
        });
        (saveEventMeetings as jest.Mock).mockResolvedValue([]);
    });

    test("READ: shows saved events with the correct event-owned slot count", async () => {
        render(<EventsPage />);
        expect(await screen.findByText("Westeros Career Fair")).toBeInTheDocument();
        // defect-3 fix: slot count comes from event-scoped slots (2), not from meetings.
        const row = screen.getByText("Westeros Career Fair").closest("tr")!;
        expect(row).toHaveTextContent("2");
    });

    test("renders the companies × slots matrix", async () => {
        render(<EventsPage />);
        await screen.findByText("Westeros Career Fair");
        // company row label + a generated slot column header (default grid starts 09:00)
        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.getAllByText("09:00").length).toBeGreaterThan(0);
    });

    test("Auto-generate calls the backend matcher", async () => {
        render(<EventsPage />);
        await screen.findByText("Westeros Career Fair");

        fireEvent.change(screen.getByLabelText(/titel/i), { target: { value: "New Job Dating" } });
        fireEvent.change(screen.getByLabelText(/datum/i), { target: { value: "2026-08-10" } });
        fireEvent.click(screen.getByText("Automatisch zuteilen"));

        await waitFor(() => {
            expect(createEvent).toHaveBeenCalled();
            expect(assignMeetings).toHaveBeenCalled();
        });
        const arg = (assignMeetings as jest.Mock).mock.calls[0][0];
        expect(arg.eventId).toBe("2");
        expect(arg.dryRun).toBe(true);
    });

    test("Save schedule commits via saveEventMeetings (not per-meeting create)", async () => {
        render(<EventsPage />);
        await screen.findByText("Westeros Career Fair");

        fireEvent.change(screen.getByLabelText(/titel/i), { target: { value: "New Job Dating" } });
        fireEvent.change(screen.getByLabelText(/datum/i), { target: { value: "2026-08-10" } });

        // auto-fill the matrix, then save
        fireEvent.click(screen.getByText("Automatisch zuteilen"));
        await waitFor(() => expect(assignMeetings).toHaveBeenCalled());

        fireEvent.click(screen.getByText("Termin speichern"));
        await waitFor(() => expect(saveEventMeetings).toHaveBeenCalled());
        const [eventIdArg, meetingsArg] = (saveEventMeetings as jest.Mock).mock.calls[0];
        expect(eventIdArg).toBe("2");
        expect(Array.isArray(meetingsArg)).toBe(true);
    });

    test("DELETE: deletes the event (cascade handles meetings)", async () => {
        render(<EventsPage />);
        await screen.findByText("Westeros Career Fair");
        fireEvent.click(screen.getByText("Löschen"));
        await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith("1"));
    });

    test("shows the Excel export button", async () => {
        render(<EventsPage />);
        expect(await screen.findByText("Excel exportieren")).toBeInTheDocument();
    });
});
