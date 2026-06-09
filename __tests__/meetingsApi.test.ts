/**
 * @jest-environment node
 *
 * Unit tests for the Task 3 "assign + reconcile" additions in lib/meetingsApi.ts:
 *   - assignMeetings   (POST /api/backend/meetings/assign, dry-run preview)
 *   - saveEventMeetings (PUT  /api/backend/events/{id}/meetings, reconcile)
 *
 * They exercise the REAL meetingsApi module (only the network boundary,
 * apiClient.apiFetch, is mocked), so the snake_case <-> camelCase DTO mapping,
 * the summary defaults / plannedMeetings normalization, the `!Array.isArray`
 * fallbacks, and the toNumberId id coercion are actually type-checked and
 * asserted — unlike the fully-mocked events-page test.
 *
 * Runs under the `node` test environment to match the sibling slotsApi suite.
 */

import { apiFetch } from "@/lib/apiClient";
import {
    assignMeetings,
    saveEventMeetings,
    type MeetingAssignmentResult,
    type BackendMeeting,
} from "@/lib/meetingsApi";

jest.mock("@/lib/apiClient", () => ({
    apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

type AssignmentResultWire = {
    dry_run: boolean;
    planned_meetings: {
        slot_id: number;
        student_id: number;
        company_id: number;
        preference_type: string;
    }[];
    inserted_meetings: number;
    summary: {
        total_company_slots: number;
        generated_meetings: number;
        assigned_like: number;
        assigned_neutral: number;
        assigned_dislike: number;
        dislike_avoided_slots: number;
        unassigned_company_slots: number;
    };
};

type MeetingDtoWire = {
    id: number;
    event_id: number;
    slot_id: number;
    slot_start_time: string;
    slot_end_time: string;
    student_id: number;
    student_first_name: string;
    student_last_name: string;
    company_id: number;
};

describe("meetingsApi — assignMeetings (Task 3)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("maps the snake_case DTO to the camelCase domain result", async () => {
        const wire: AssignmentResultWire = {
            dry_run: true,
            planned_meetings: [
                {
                    slot_id: 100,
                    student_id: 1,
                    company_id: 6,
                    preference_type: "like",
                },
            ],
            inserted_meetings: 0,
            summary: {
                total_company_slots: 6,
                generated_meetings: 1,
                assigned_like: 1,
                assigned_neutral: 0,
                assigned_dislike: 0,
                dislike_avoided_slots: 0,
                unassigned_company_slots: 5,
            },
        };
        mockedApiFetch.mockResolvedValue(wire);

        const result = await assignMeetings({ eventId: "1", dryRun: true });

        const expected: MeetingAssignmentResult = {
            dryRun: true,
            plannedMeetings: [
                {
                    slotId: "100",
                    studentId: "1",
                    companyId: "6",
                    preferenceType: "like",
                },
            ],
            insertedMeetings: 0,
            summary: {
                totalCompanySlots: 6,
                generatedMeetings: 1,
                assignedLike: 1,
                assignedNeutral: 0,
                assignedDislike: 0,
                dislikeAvoidedSlots: 0,
                unassignedCompanySlots: 5,
            },
        };
        expect(result).toEqual(expected);
    });

    test("sends event_id/slot_ids/student_ids as numbers with default flags", async () => {
        mockedApiFetch.mockResolvedValue({});

        await assignMeetings({
            eventId: "1",
            slotIds: ["100", "101"],
            studentIds: ["1", "2"],
        });

        expect(mockedApiFetch).toHaveBeenCalledWith(
            "/api/backend/meetings/assign",
            {
                method: "POST",
                body: JSON.stringify({
                    event_id: 1,
                    slot_ids: [100, 101],
                    student_ids: [1, 2],
                    dry_run: false,
                    replace_existing: false,
                    include_inactive_companies: false,
                }),
            }
        );
    });

    test("forwards explicit flags (dryRun / replaceExisting / includeInactiveCompanies)", async () => {
        mockedApiFetch.mockResolvedValue({});

        await assignMeetings({
            eventId: "1",
            dryRun: true,
            replaceExisting: true,
            includeInactiveCompanies: true,
        });

        const body = JSON.parse(
            (mockedApiFetch.mock.calls[0][1] as { body: string }).body
        );
        expect(body.dry_run).toBe(true);
        expect(body.replace_existing).toBe(true);
        expect(body.include_inactive_companies).toBe(true);
        // Optional arrays stay absent when not provided.
        expect(body).not.toHaveProperty("slot_ids");
        expect(body).not.toHaveProperty("student_ids");
    });

    test("applies summary defaults and an empty plannedMeetings array when fields are missing", async () => {
        mockedApiFetch.mockResolvedValue({});

        const result = await assignMeetings({ eventId: "1" });

        expect(result).toEqual({
            dryRun: false,
            plannedMeetings: [],
            insertedMeetings: 0,
            summary: {
                totalCompanySlots: 0,
                generatedMeetings: 0,
                assignedLike: 0,
                assignedNeutral: 0,
                assignedDislike: 0,
                dislikeAvoidedSlots: 0,
                unassignedCompanySlots: 0,
            },
        });
    });

    test("falls back to an empty array when planned_meetings is not an array", async () => {
        mockedApiFetch.mockResolvedValue({
            planned_meetings: "oops" as unknown as [],
        });

        const result = await assignMeetings({ eventId: "1" });

        expect(result.plannedMeetings).toEqual([]);
    });

    test("rejects an empty eventId before calling the backend", async () => {
        await expect(assignMeetings({ eventId: "" })).rejects.toThrow(
            "event_id ist keine gültige ID."
        );
        expect(mockedApiFetch).not.toHaveBeenCalled();
    });

    test("rejects an invalid slotId before calling the backend", async () => {
        await expect(
            assignMeetings({ eventId: "1", slotIds: ["abc"] })
        ).rejects.toThrow("slot_id ist keine gültige ID.");
        expect(mockedApiFetch).not.toHaveBeenCalled();
    });
});

describe("meetingsApi — saveEventMeetings (Task 3)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("PUTs numeric meeting ids to the event-scoped reconcile endpoint", async () => {
        mockedApiFetch.mockResolvedValue([]);

        await saveEventMeetings("1", [
            { slotId: "100", studentId: "1", companyId: "6" },
        ]);

        expect(mockedApiFetch).toHaveBeenCalledWith(
            "/api/backend/events/1/meetings",
            {
                method: "PUT",
                body: JSON.stringify({
                    meetings: [
                        { slot_id: 100, student_id: 1, company_id: 6 },
                    ],
                }),
            }
        );
    });

    test("maps the returned meeting DTOs to the domain shape", async () => {
        const wire: MeetingDtoWire = {
            id: 10,
            event_id: 1,
            slot_id: 100,
            slot_start_time: "09:00:00",
            slot_end_time: "09:15:00",
            student_id: 1,
            student_first_name: "Sansa",
            student_last_name: "Stark",
            company_id: 6,
        };
        mockedApiFetch.mockResolvedValue([wire]);

        const meetings = await saveEventMeetings("1", [
            { slotId: "100", studentId: "1", companyId: "6" },
        ]);

        const expected: BackendMeeting = {
            id: "10",
            eventId: "1",
            slotId: "100",
            slotStartTime: "09:00:00",
            slotEndTime: "09:15:00",
            studentId: "1",
            studentName: "Sansa Stark",
            companyId: "6",
        };
        expect(meetings).toEqual([expected]);
    });

    test("returns an empty array when the backend payload is not an array", async () => {
        mockedApiFetch.mockResolvedValue(
            undefined as unknown as MeetingDtoWire[]
        );

        await expect(saveEventMeetings("1", [])).resolves.toEqual([]);
    });

    test("rejects an empty eventId before calling the backend", async () => {
        await expect(saveEventMeetings("", [])).rejects.toThrow(
            "event_id ist keine gültige ID."
        );
        expect(mockedApiFetch).not.toHaveBeenCalled();
    });

    test("rejects an invalid meeting id before calling the backend", async () => {
        await expect(
            saveEventMeetings("1", [
                { slotId: "100", studentId: "", companyId: "6" },
            ])
        ).rejects.toThrow("student_id ist keine gültige ID.");
        expect(mockedApiFetch).not.toHaveBeenCalled();
    });
});
