import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyCompanyProfilePage from "@/app/(app)/me/page";
import { getCurrentUser } from "@/lib/authApi";
import { getCompanyById, updateCompany } from "@/lib/companiesApi";

jest.mock("@/lib/authApi", () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/companiesApi", () => ({
    getCompanyById: jest.fn(),
    updateCompany: jest.fn(),
}));

const mockCompany = {
    id: "6",
    userId: "abc",
    name: "Winterfell Logistics",
    description: "Winter is coming.",
    website: "https://winterfell.net",
    status: "Aktiv",
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
        expect(screen.getByText("Aktiv")).toBeInTheDocument();
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
});