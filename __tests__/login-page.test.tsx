import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(public)/login/page";
import { getSupabaseClient } from "@/lib/supabaseClient";

const pushMock = jest.fn();
const signInWithPasswordMock = jest.fn();

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: pushMock,
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
    }),
}));

jest.mock("@/lib/supabaseClient", () => ({
    getSupabaseClient: jest.fn(),
}));

describe("LoginPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (getSupabaseClient as jest.Mock).mockReturnValue({
            auth: {
                signInWithPassword: signInWithPasswordMock,
            },
        });
    });


    test("should login with valid credentials", async () => {
        signInWithPasswordMock.mockResolvedValue({
            data: {
                session: { access_token: "test-token" },
                user: { email: "admin@test.at" },
            },
            error: null,
        });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/e-mail/i), {
            target: { value: "admin@test.at" },
        });

        fireEvent.change(screen.getByLabelText(/passwort/i), {
            target: { value: "123456" },
        });

        fireEvent.click(screen.getByText("Einloggen"));

        await waitFor(() => {
            expect(signInWithPasswordMock).toHaveBeenCalledWith({
                email: "admin@test.at",
                password: "123456",
            });
        });
    });


    test("should show error for invalid login", async () => {
        signInWithPasswordMock.mockResolvedValue({
            data: null,
            error: { message: "Login fehlgeschlagen." },
        });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/e-mail/i), {
            target: { value: "wrong@test.at" },
        });

        fireEvent.change(screen.getByLabelText(/passwort/i), {
            target: { value: "wrong" },
        });

        fireEvent.click(screen.getByText("Einloggen"));

        expect(await screen.findByText("Login fehlgeschlagen.")).toBeInTheDocument();
    });
});