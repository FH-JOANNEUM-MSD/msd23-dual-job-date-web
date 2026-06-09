import { render, screen, fireEvent } from "@testing-library/react";
import StudentsPage from "@/app/(app)/students/page";
import { getStudents } from "@/lib/studentsApi";

jest.mock("@/lib/studentsApi", () => ({
    getStudents: jest.fn(),
}));

describe("StudentsPage", () => {
    beforeEach(() => {
        (getStudents as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Jon Snow",
                studyProgram: "Night's Watch Defense",
                semester: 1,
            },
            {
                id: "2",
                name: "Sansa Stark",
                studyProgram: "Dragon Management",
                semester: 2,
            },
        ]);
    });


    test("should display students", async () => {
        render(<StudentsPage />);

        expect(await screen.findByText("Jon Snow")).toBeInTheDocument();
        expect(screen.getByText("Sansa Stark")).toBeInTheDocument();
    });


    test("should filter students by search input", async () => {
        render(<StudentsPage />);

        await screen.findByText("Jon Snow");

        fireEvent.change(screen.getByPlaceholderText("Studierende suchen..."), {
            target: { value: "Sansa" },
        });

        expect(screen.queryByText("Jon Snow")).not.toBeInTheDocument();
        expect(screen.getByText("Sansa Stark")).toBeInTheDocument();
    });


    test("should show invite button", async () => {
        render(<StudentsPage />);

        expect(await screen.findByText("+ Studierende einladen")).toBeInTheDocument();
    });
});