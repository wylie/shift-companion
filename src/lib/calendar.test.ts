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
      },
    ];

    const calendar = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-24T12:00:00Z"),
      productId: "-//Test//EN",
    });

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("SUMMARY:Front Desk Closing");
    expect(calendar).toContain("LOCATION:Main Welcome Desk");
    expect(calendar).toContain("UID:shift-1@teams-shifts-companion.local");
    expect(calendar).not.toContain("Taylor Gomez");
    expect(calendar).toContain("\r\n");
  });
});
