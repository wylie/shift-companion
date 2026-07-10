import { describe, expect, it } from "vitest";
import { buildCalendarIcs } from "./calendar";
import type { Shift } from "../types";

describe("buildCalendarIcs", () => {
  it("exports minimal shift details for the provided shifts", () => {
    const shifts: Shift[] = [
      {
        id: "shift-1",
        userId: "user-staff-1",
        title: "Front Desk Closing",
        department: "Front Desk",
        start: "2026-07-08T14:00:00",
        end: "2026-07-08T20:00:00",
        location: "Main Welcome Desk",
        updatedAt: "2026-07-01T14:30:00Z",
      },
    ];

    const calendar = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-24T12:00:00Z"),
      productId: "-//Test//EN",
    });

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("SUMMARY:Front Desk Closing");
    expect(calendar).toContain("LOCATION:Main Welcome Desk");
    expect(calendar).toContain("UID:");
    expect(calendar).toContain("LAST-MODIFIED:20260701T143000Z");
    expect(calendar).not.toContain("Taylor Gomez");
    expect(calendar).toContain("\r\n");
  });

  it("uses stable opaque UIDs and escapes ICS text correctly", () => {
    const shifts: Shift[] = [
      {
        id: "shift-1",
        userId: "user-staff-1",
        title: "Front Desk, Closing; Notes",
        start: "2026-07-08T14:00:00Z",
        end: "2026-07-08T20:00:00Z",
        location: "Main Welcome Desk\\North",
      },
    ];

    const first = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-24T12:00:00Z"),
      productId: "-//Test//EN",
    });
    const second = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-25T12:00:00Z"),
      productId: "-//Test//EN",
    });
    const firstUidLine = first
      .split("\r\n")
      .find((line) => line.startsWith("UID:"));
    const secondUidLine = second
      .split("\r\n")
      .find((line) => line.startsWith("UID:"));

    expect(firstUidLine).toBe(secondUidLine);
    expect(first).toContain("SUMMARY:Front Desk\\, Closing\\; Notes");
    expect(first).toContain("LOCATION:Main Welcome Desk\\\\North");
  });
});
