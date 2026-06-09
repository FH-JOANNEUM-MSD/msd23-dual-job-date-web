/**
 * @jest-environment node
 *
 * Unit tests for the Task 2 "event-owned slots" change in lib/slotsApi.ts and
 * the proxy query-string forwarding it depends on (app/api/backend/_proxy.ts).
 *
 * These exercise the REAL slotsApi/_proxy modules (only the network boundary is
 * mocked), so the new `eventId` field and the `event_id` wire format are
 * actually type-checked and asserted — unlike the fully-mocked page test.
 *
 * Runs under the `node` test environment because next/server relies on the Web
 * Request/Response/fetch globals, which jsdom does not provide.
 */

import { apiFetch } from "@/lib/apiClient";
import { createSlot, getAllSlots, type BackendSlot } from "@/lib/slotsApi";

jest.mock("@/lib/apiClient", () => ({
    apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

type SlotDtoWire = {
    id: number;
    start_time: string;
    end_time: string;
    event_id: number;
};

const slotDto: SlotDtoWire = {
    id: 100,
    start_time: "09:00:00",
    end_time: "09:15:00",
    event_id: 1,
};

describe("slotsApi — event-owned slots (Task 2)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllSlots", () => {
        test("forwards event_id as a query string when an eventId is given", async () => {
            mockedApiFetch.mockResolvedValue([slotDto]);

            const slots = await getAllSlots("1");

            expect(mockedApiFetch).toHaveBeenCalledWith(
                "/api/backend/slots?event_id=1"
            );
            // Read mapping surfaces the new eventId field.
            const expected: BackendSlot = {
                id: "100",
                startTime: "09:00:00",
                endTime: "09:15:00",
                eventId: "1",
            };
            expect(slots).toEqual([expected]);
        });

        test("omits the query string when no eventId is given", async () => {
            mockedApiFetch.mockResolvedValue([]);

            await getAllSlots();

            expect(mockedApiFetch).toHaveBeenCalledWith("/api/backend/slots");
        });

        test("returns an empty array when the backend payload is not an array", async () => {
            mockedApiFetch.mockResolvedValue(
                undefined as unknown as SlotDtoWire[]
            );

            await expect(getAllSlots("1")).resolves.toEqual([]);
        });
    });

    describe("createSlot", () => {
        test("sends event_id as a number alongside the slot times", async () => {
            mockedApiFetch.mockResolvedValue(slotDto);

            const created = await createSlot({
                startTime: "09:00:00",
                endTime: "09:15:00",
                eventId: "1",
            });

            expect(mockedApiFetch).toHaveBeenCalledWith("/api/backend/slots", {
                method: "POST",
                body: JSON.stringify({
                    start_time: "09:00:00",
                    end_time: "09:15:00",
                    event_id: 1,
                }),
            });
            expect(created.eventId).toBe("1");
        });

        test("rejects an empty eventId before calling the backend", async () => {
            await expect(
                createSlot({
                    startTime: "09:00:00",
                    endTime: "09:15:00",
                    eventId: "",
                })
            ).rejects.toThrow("event_id ist keine gültige ID.");
            expect(mockedApiFetch).not.toHaveBeenCalled();
        });

        test("rejects a non-numeric eventId before calling the backend", async () => {
            await expect(
                createSlot({
                    startTime: "09:00:00",
                    endTime: "09:15:00",
                    eventId: "abc",
                })
            ).rejects.toThrow("event_id ist keine gültige ID.");
            expect(mockedApiFetch).not.toHaveBeenCalled();
        });
    });
});

describe("proxyBackendRequest — query-string forwarding (Task 2 dependency)", () => {
    const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    beforeEach(() => {
        jest.resetModules();
        process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.test";
    });

    afterEach(() => {
        if (ORIGINAL_BASE_URL === undefined) {
            delete process.env.NEXT_PUBLIC_API_BASE_URL;
        } else {
            process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_BASE_URL;
        }
    });

    test("appends request.nextUrl.search to the backend URL", async () => {
        const fetchMock = jest.fn<
            Promise<Response>,
            [string | URL | Request, RequestInit?]
        >(() =>
            Promise.resolve(
                new Response(JSON.stringify([slotDto]), {
                    status: 200,
                    headers: { "content-type": "application/json" },
                })
            )
        );
        const originalFetch = global.fetch;
        global.fetch = fetchMock as unknown as typeof global.fetch;

        try {
            // Import after env + fetch are in place: _proxy reads BACKEND_BASE_URL
            // at module load, and NextRequest is loaded fresh per resetModules.
            const { NextRequest } = await import("next/server");
            const { proxyBackendRequest } = await import(
                "@/app/api/backend/_proxy"
            );

            const request = new NextRequest(
                "http://localhost/api/backend/slots?event_id=1",
                { headers: { authorization: "Bearer token" } }
            );

            const response = await proxyBackendRequest({
                request,
                method: "GET",
                backendPath: "/api/slots",
            });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const calledUrl = fetchMock.mock.calls[0][0];
            expect(calledUrl).toBe("https://backend.test/api/slots?event_id=1");
            expect(response.status).toBe(200);
        } finally {
            global.fetch = originalFetch;
        }
    });
});
