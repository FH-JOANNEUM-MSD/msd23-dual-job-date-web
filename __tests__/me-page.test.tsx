import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyCompanyProfilePage from "@/app/(app)/me/page";
import { getCurrentUser } from "@/lib/authApi";
import { getCompanyById, updateCompany } from "@/lib/companiesApi";
import { getMeetingsForCompany } from "@/lib/meetingsApi";
import { getActiveEvents } from "@/lib/eventsApi";

jest.mock("@/lib/authApi", () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/companiesApi", () => ({
    getCompanyById: jest.fn(),
    updateCompany: jest.fn(),
}));

jest.mock("@/lib/meetingsApi", () => ({
    getMeetingsForCompany: jest.fn(),
}));

jest.mock("@/lib/eventsApi", () => ({
    getActiveEvents: jest.fn(),
}));

const mockCompany = {
    id: "6",
    userId: "abc",
    name: "Winterfell Logistics",
    shortDescription: "Kurzbeschreibung",
    description: "Winter is coming.",
    website: "https://winterfell.net",
    status: "Aktiv",
    logoUrl: "",
    imageUrls: [],
};

/**
 * Tests the company profile page behavior.
 * Ensures that the logged-in company can view and edit its profile.
 */
describe("MyCompanyProfilePage", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (getCurrentUser as jest.Mock).mockResolvedValue({
            role: "company",
            company_id: "6",
        });

        (getCompanyById as jest.Mock).mockResolvedValue(mockCompany);
        (updateCompany as jest.Mock).mockResolvedValue({});

        (getActiveEvents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Westeros Career Fair",
                eventDate: new Date().toISOString().split("T")[0],
                location: "King's Landing",
                description: "Meet all the high lords.",
                isActive: true,
            },
        ]);

        (getMeetingsForCompany as jest.Mock).mockResolvedValue([
            {
                id: "8",
                eventId: "1",
                slotId: "2",
                slotStartTime: "09:15",
                slotEndTime: "09:30",
                studentId: "5",
                studentName: "Sansa Stark",
                companyId: "6",
            },
        ]);
    });

    /**
     * Should display the company's profile after loading.
     */
    test("should display the company's profile", async () => {
        render(<MyCompanyProfilePage />);

        expect(screen.getByText("Profil wird geladen...")).toBeInTheDocument();

        expect(await screen.findByText("Mein Unternehmensprofil")).toBeInTheDocument();
        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.getByText("Winter is coming.")).toBeInTheDocument();
        expect(screen.getByText("https://winterfell.net")).toBeInTheDocument();
        expect(screen.getByText("Teilnahme am Jobdating")).toBeInTheDocument();
    });

    /**
     * Should switch to edit mode when clicking the edit button.
     */
    test("should switch to edit mode when clicking edit button", async () => {
        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByText("Profil bearbeiten"));

        expect(screen.getByText("Unternehmensprofil bearbeiten")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Winter is coming.")).toBeInTheDocument();
    });

    /**
     * should save updated company data
     */
    test("should save updated company data", async () => {
        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByText("Profil bearbeiten"));

        fireEvent.change(screen.getByDisplayValue("Winterfell Logistics"), {
            target: { value: "Winterfell Logistics GmbH" },
        });

        fireEvent.change(screen.getByDisplayValue("Winter is coming."), {
            target: { value: "Updated description" },
        });

        fireEvent.click(screen.getByText("Speichern"));

        await waitFor(() => {
            expect(updateCompany).toHaveBeenCalledWith("6", {
                name: "Winterfell Logistics GmbH",
                short_description: "Kurzbeschreibung",
                description: "Updated description",
                website: "https://winterfell.net",
                active: true,
            });
        });
    });

    /**
     * should show error when no company_id is available
     */
    test("should show error when no company_id is available", async () => {
        (getCurrentUser as jest.Mock).mockResolvedValue({
            role: "company",
        });

        render(<MyCompanyProfilePage />);

        expect(
            await screen.findByText("Für diesen Account wurde keine company_id gefunden.")
        ).toBeInTheDocument();
    });


    test("should show job dating assignments on the event day", async () => {
        render(<MyCompanyProfilePage />);

        expect(await screen.findByText("Zuteilung Job Dating")).toBeInTheDocument();

        expect(screen.getByText("Westeros Career Fair")).toBeInTheDocument();
        expect(screen.getByText("Sansa Stark")).toBeInTheDocument();
        expect(screen.getByText("09:15 - 09:30")).toBeInTheDocument();
    });


    test("should not show assignments before the event day", async () => {
        (getActiveEvents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Westeros Career Fair",
                eventDate: "2099-07-08",
                location: "King's Landing",
                description: "Meet all the high lords.",
                isActive: true,
            },
        ]);

        render(<MyCompanyProfilePage />);

        expect(
            await screen.findByText("Die Zuteilungen werden erst am Veranstaltungstag freigeschaltet.")
        ).toBeInTheDocument();

        expect(screen.queryByText("Sansa Stark")).not.toBeInTheDocument();
    });


    test("should only show meetings for the active event", async () => {
        const today = new Date().toISOString().split("T")[0];

        (getActiveEvents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Westeros Career Fair",
                eventDate: today,
                location: "King's Landing",
                description: "Meet all the high lords.",
                isActive: true,
            },
        ]);

        (getMeetingsForCompany as jest.Mock).mockResolvedValue([
            {
                id: "8",
                eventId: "1",
                slotId: "2",
                slotStartTime: "09:15",
                slotEndTime: "09:30",
                studentId: "5",
                studentName: "Sansa Stark",
                companyId: "6",
            },
            {
                id: "9",
                eventId: "2",
                slotId: "3",
                slotStartTime: "10:00",
                slotEndTime: "10:15",
                studentId: "7",
                studentName: "Arya Stark",
                companyId: "6",
            },
        ]);

        render(<MyCompanyProfilePage />);

        expect(await screen.findByText("Sansa Stark")).toBeInTheDocument();
        expect(screen.queryByText("Arya Stark")).not.toBeInTheDocument();
    });


    test("should add https to website before saving", async () => {
        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByText("Profil bearbeiten"));

        fireEvent.change(screen.getByDisplayValue("https://winterfell.net"), {
            target: { value: "winterfell.net" },
        });

        fireEvent.click(screen.getByText("Speichern"));

        await waitFor(() => {
            expect(updateCompany).toHaveBeenCalledWith("6", expect.objectContaining({
                website: "https://winterfell.net",
            }));
        });
    });


    test("should reset form when cancelling edit", async () => {
        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByText("Profil bearbeiten"));

        fireEvent.change(screen.getByDisplayValue("Winterfell Logistics"), {
            target: { value: "Changed Name" },
        });

        fireEvent.click(screen.getByText("Abbrechen"));

        expect(await screen.findByText("Mein Unternehmensprofil")).toBeInTheDocument();
        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.queryByText("Changed Name")).not.toBeInTheDocument();
    });


    test("should remove an image", async () => {
        (getCompanyById as jest.Mock).mockResolvedValue({
            ...mockCompany,
            imageUrls: ["https://example.com/image.jpg"],
        });

        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByTitle("Bild entfernen"));

        await waitFor(() => {
            expect(updateCompany).toHaveBeenCalledWith("6", {
                image_urls: "",
            });
        });
    });


    test("should remove logo", async () => {
        (getCompanyById as jest.Mock).mockResolvedValue({
            ...mockCompany,
            logoUrl: "https://example.com/logo.jpg",
        });

        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByTitle("Logo entfernen"));

        await waitFor(() => {
            expect(updateCompany).toHaveBeenCalledWith("6", {
                logo_url: "",
            });
        });
    });


    test("should show error when short description is empty", async () => {
        render(<MyCompanyProfilePage />);

        fireEvent.click(await screen.findByText("Profil bearbeiten"));

        fireEvent.change(screen.getByPlaceholderText("Kurze Beschreibung des Unternehmens"), {
            target: { value: "" },
        });

        fireEvent.click(screen.getByText("Speichern"));

        expect(await screen.findByText("Bitte Kurzbeschreibung eingeben.")).toBeInTheDocument();
        expect(updateCompany).not.toHaveBeenCalled();
    });

});