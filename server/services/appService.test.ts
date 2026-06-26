import { describe, expect, it } from "vitest";
import { buildCalendarIcs } from "../../src/lib/calendar";
import type { Shift } from "../../src/types";
import { createMockDataAccess } from "../data/mockDataAccess";
import type { ScheduleProvider } from "../integrations/types";
import { AppService } from "./appService";

function createScheduleProviderStub(shifts: Shift[]): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange() {
      return {
        data: shifts,
        ok: true,
        status: {
          availability: "available",
          message: "stub",
          providerId: "neon-demo",
        },
      };
    },
    async getCurrentUserShiftById({ shiftId }) {
      return {
        data: shifts.find((shift) => shift.id === shiftId),
        ok: true,
        status: {
          availability: "available",
          message: "stub",
          providerId: "neon-demo",
        },
      };
    },
    async getProviderStatus() {
      return {
        availability: "available",
        message: "stub",
        providerId: "neon-demo",
      };
    },
  };
}

describe("AppService calendar export", () => {
  it("returns only the current preview user's shifts for calendar export", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
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
      1,
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

  it("limits calendar export to the selected displayed window", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(shifts.every((shift) => shift.start < "2026-06-29T00:00:00")).toBe(
      true,
    );
  });

  it("uses the schedule provider boundary for schedule and calendar lookups", async () => {
    const dataAccess = createMockDataAccess();
    const currentUser = await new AppService(dataAccess).getPreviewUser(
      "user-staff-1",
    );
    const providerShifts: Shift[] = [
      {
        id: "shift-provider-1",
        userId: currentUser.id,
        title: "Provider Shift",
        start: "2026-06-23T14:00:00.000Z",
        end: "2026-06-23T18:00:00.000Z",
        location: "Wellness Floor",
      },
    ];
    const service = new AppService(dataAccess, {
      scheduleProvider: createScheduleProviderStub(providerShifts),
    });

    const visibleShifts = await service.listOwnShifts(currentUser);
    const exportableShifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(visibleShifts).toEqual(providerShifts);
    expect(exportableShifts).toEqual(providerShifts);
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
