import { describe, expect, it } from "vitest";
import { buildCalendarIcs } from "../../src/lib/calendar";
import { createMockDataAccess } from "../data/mockDataAccess";
import { AppService } from "./appService";

describe("AppService calendar export", () => {
  it("returns only the current preview user's shifts for calendar export", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
    );

    expect(shifts.length).toBeGreaterThan(0);
    expect(shifts.every((shift) => shift.userId === "user-staff-1")).toBe(true);
    expect(shifts.some((shift) => shift.userId === "user-staff-2")).toBe(false);
  });

  it("builds ICS content without another user's shift details", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
    );
    const ics = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-24T12:00:00Z"),
      productId: "-//Test//EN",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Wellness Attendant");
    expect(ics).not.toContain("Membership Support");
    expect(ics).not.toContain("Taylor Gomez");
  });
});

describe("AppService manager review logging", () => {
  it("deduplicates repeated manager review audit events for the same week", async () => {
    const service = new AppService(createMockDataAccess());
    const manager = await service.getPreviewUser("user-manager-1");
    const firstEvent = await service.recordManagerReview(
      manager,
      "wellness",
      new Date("2026-06-22T00:00:00"),
    );
    const secondEvent = await service.recordManagerReview(
      manager,
      "wellness",
      new Date("2026-06-22T00:00:00"),
    );

    expect(secondEvent.id).toBe(firstEvent.id);
  });
});
