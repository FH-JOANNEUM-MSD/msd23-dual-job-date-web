import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EventsPage from "@/app/(app)/events/page";
import {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from "@/lib/eventsApi";
import {
    getAllMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
} from "@/lib/meetingsApi";
import { getCompanies } from "@/lib/companiesApi";
import { getStudents } from "@/lib/studentsApi";
import { getAllPreferences } from "@/lib/preferencesApi";
import { getAllSlots, createSlot } from "@/lib/slotsApi";

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
    }),
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
    createMeeting: jest.fn(),
    updateMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
}));

jest.mock("@/lib/companiesApi", () => ({
    getCompanies: jest.fn(),
}));

jest.mock("@/lib/studentsApi", () => ({
    getStudents: jest.fn(),
}));

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

describe("EventsPage CRUD", () => {
    beforeAll(() => {
        window.scrollTo = jest.fn();
        window.confirm = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        (window.confirm as jest.Mock).mockReturnValue(true);

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
                name: "Winterfell Logistics",
                active: true,
                status: "Aktiv",
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
                id: "10",
                eventId: "1",
                slotId: "100",
                slotStartTime: "09:00:00",
                slotEndTime: "09:15:00",
                studentId: "1",
                studentName: "Sansa Stark",
                companyId: "6",
            },
        ]);

        (getAllSlots as jest.Mock).mockResolvedValue([
            {
                id: "100",
                startTime: "09:00:00",
                endTime: "09:15:00",
            },
        ]);

        (createSlot as jest.Mock).mockResolvedValue({
            id: "101",
            startTime: "09:15:00",
            endTime: "09:30:00",
        });

        (createEvent as jest.Mock).mockResolvedValue({
            id: "2",
            name: "New Job Dating",
            eventDate: "2026-08-10",
            location: "",
            description: "Akademisches Programm: Dragon Management; Semester: Alle Semester",
            isActive: true,
        });

        (updateEvent as jest.Mock).mockResolvedValue({
            id: "1",
            name: "Updated Career Fair",
            eventDate: "2026-07-08",
            location: "King's Landing",
            description: "Akademisches Programm: Dragon Management; Semester: Alle Semester",
            isActive: true,
        });

        (deleteEvent as jest.Mock).mockResolvedValue({
            message: "deleted",
        });

        (createMeeting as jest.Mock).mockResolvedValue({
            id: "11",
            eventId: "2",
            slotId: "100",
            studentId: "1",
            studentName: "Sansa Stark",
            companyId: "6",
        });

        (updateMeeting as jest.Mock).mockResolvedValue({
            id: "10",
            eventId: "1",
            slotId: "100",
            studentId: "1",
            studentName: "Sansa Stark",
            companyId: "6",
        });

        (deleteMeeting as jest.Mock).mockResolvedValue({
            message: "deleted",
        });
    });


    test("READ: should display saved events", async () => {
        render(<EventsPage />);

        expect(await screen.findByText("Westeros Career Fair")).toBeInTheDocument();
        expect(screen.getByText("2026-07-08")).toBeInTheDocument();
        expect(screen.getByText("King's Landing")).toBeInTheDocument();
    });


    test("CREATE: should create a new event and meeting", async () => {
        render(<EventsPage />);

        await screen.findByText("Westeros Career Fair");

        fireEvent.change(screen.getByLabelText(/titel/i), {
            target: { value: "New Job Dating" },
        });

        fireEvent.change(screen.getByLabelText(/datum/i), {
            target: { value: "2026-08-10" },
        });

        fireEvent.click(screen.getByText("Termin speichern"));

        await waitFor(() => {
            expect(createEvent).toHaveBeenCalledWith({
                name: "New Job Dating",
                eventDate: "2026-08-10",
                location: "",
                description: "Akademisches Programm: Dragon Management; Semester: Alle Semester",
                isActive: true,
            });
        });

        expect(createMeeting).toHaveBeenCalledWith({
            eventId: "2",
            slotId: "100",
            studentId: "1",
            companyId: "6",
        });
    });


    test("UPDATE: should update an existing event", async () => {
        render(<EventsPage />);

        await screen.findByText("Westeros Career Fair");

        fireEvent.click(screen.getByText("Bearbeiten"));

        fireEvent.change(screen.getByLabelText(/titel/i), {
            target: { value: "Updated Career Fair" },
        });

        fireEvent.click(screen.getByText("Änderungen speichern"));

        await waitFor(() => {
            expect(updateEvent).toHaveBeenCalledWith("1", {
                name: "Updated Career Fair",
                eventDate: "2026-07-08",
                description: "Akademisches Programm: Dragon Management; Semester: Alle Semester",
                isActive: true,
                location: "King's Landing",
            });
        });
    });


    test("DELETE: should delete an existing event", async () => {
        render(<EventsPage />);

        await screen.findByText("Westeros Career Fair");

        fireEvent.click(screen.getByText("Löschen"));

        await waitFor(() => {
            expect(deleteMeeting).toHaveBeenCalledWith("10");
            expect(deleteEvent).toHaveBeenCalledWith("1");
        });
    });


    test("should show excel export button", async () => {
        render(<EventsPage />);

        expect(await screen.findByText("Excel exportieren")).toBeInTheDocument();
    });
});