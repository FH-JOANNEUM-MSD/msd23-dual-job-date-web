import { render, screen, fireEvent } from "@testing-library/react";
import CompaniesPage from "@/app/(app)/companies/page";
import { useCompaniesStore } from "@/lib/companiesStore";

jest.mock("@/lib/companiesStore", () => ({
    useCompaniesStore: jest.fn(),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
    }),
    usePathname: () => "/companies",
    useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/companiesStore", () => ({
    useCompaniesStore: jest.fn(),
}));

describe("CompaniesPage", () => {
    beforeEach(() => {
        (useCompaniesStore as jest.Mock).mockReturnValue({
            companies: [
                {
                    id: "1",
                    name: "Winterfell Logistics",
                    description: "Winter is coming.",
                    website: "https://winterfell.net",
                    status: "Aktiv",
                },
                {
                    id: "2",
                    name: "Lannister Gold",
                    description: "Finance company.",
                    website: "https://lannister.gold",
                    status: "Inaktiv",
                },
            ],
            isLoading: false,
            loadCompanies: jest.fn(),
            deleteCompany: jest.fn(),
            getById: jest.fn(),
        });
    });


    test("should display companies", () => {
        render(<CompaniesPage />);

        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.getByText("Lannister Gold")).toBeInTheDocument();
    });


    test("should filter companies by search input", () => {
        render(<CompaniesPage />);

        fireEvent.change(screen.getByPlaceholderText("Unternehmen suchen..."), {
            target: { value: "Winterfell" },
        });

        expect(screen.getByText("Winterfell Logistics")).toBeInTheDocument();
        expect(screen.queryByText("Lannister Gold")).not.toBeInTheDocument();
    });


    test("should display participation wording instead of active status", () => {
        render(<CompaniesPage />);

        expect(screen.getByText("Teilnahme")).toBeInTheDocument();
        expect(screen.getByText("Keine Teilnahme")).toBeInTheDocument();
    });
});