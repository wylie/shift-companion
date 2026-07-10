import { describe, expect, it } from "vitest";
import type { Shift } from "../models/schedule.js";
import { buildScheduleSummary, getNextShift } from "./scheduleSummary.js";

function createShift(
  id: string,
  start: string,
  end: string,
  title = "Shift",
  location = "Main Building",
): Shift {
  return {
    id,
    userId: "user-staff-1",
    title,
    start,
    end,
    location,
  };
}

describe("schedule summary", () => {
  it("includes a shift today in today's shifts", () => {
    const shifts = [
      createShift("shift-1", "2026-07-10T09:00:00", "2026-07-10T13:00:00"),
    ];

    const summary = buildScheduleSummary(
      shifts,
      new Date("2026-07-10T08:30:00"),
    );

    expect(summary.todayShifts.map((shift) => shift.id)).toEqual(["shift-1"]);
  });

  it("includes multiple shifts scheduled for today", () => {
    const shifts = [
      createShift("shift-1", "2026-07-10T09:00:00", "2026-07-10T13:00:00"),
      createShift("shift-2", "2026-07-10T15:00:00", "2026-07-10T19:00:00"),
      createShift("shift-3", "2026-07-11T10:00:00", "2026-07-11T14:00:00"),
    ];

    const summary = buildScheduleSummary(
      shifts,
      new Date("2026-07-10T08:30:00"),
    );

    expect(summary.todayShifts.map((shift) => shift.id)).toEqual([
      "shift-1",
      "shift-2",
    ]);
  });

  it("uses tomorrow's earliest shift as next shift when today's shifts are finished", () => {
    const shifts = [
      createShift("shift-1", "2026-07-10T09:00:00", "2026-07-10T12:00:00"),
      createShift("shift-2", "2026-07-11T07:00:00", "2026-07-11T11:00:00"),
      createShift("shift-3", "2026-07-11T09:00:00", "2026-07-11T13:00:00"),
    ];

    const nextShift = getNextShift(shifts, new Date("2026-07-10T18:00:00"));

    expect(nextShift?.id).toBe("shift-2");
  });

  it("uses a later shift today as next shift while an earlier shift is already finished", () => {
    const shifts = [
      createShift("shift-1", "2026-07-10T06:00:00", "2026-07-10T10:00:00"),
      createShift("shift-2", "2026-07-10T15:00:00", "2026-07-10T19:00:00"),
    ];

    const nextShift = getNextShift(shifts, new Date("2026-07-10T13:00:00"));

    expect(nextShift?.id).toBe("shift-2");
  });

  it("does not choose a completed shift as next shift", () => {
    const shifts = [
      createShift("shift-1", "2026-07-10T07:00:00", "2026-07-10T11:00:00"),
      createShift("shift-2", "2026-07-10T12:30:00", "2026-07-10T16:30:00"),
    ];

    const nextShift = getNextShift(shifts, new Date("2026-07-10T11:30:00"));

    expect(nextShift?.id).toBe("shift-2");
  });

  it("keeps local dates near midnight on the intended calendar day", () => {
    const shifts = [
      createShift(
        "shift-1",
        "2026-07-10T23:30:00",
        "2026-07-11T01:00:00",
        "Late close",
      ),
    ];

    const summary = buildScheduleSummary(
      shifts,
      new Date("2026-07-10T20:00:00"),
    );

    expect(summary.todayShifts.map((shift) => shift.id)).toEqual(["shift-1"]);
    expect(summary.nextShift?.id).toBe("shift-1");
  });
});
