import { describe, expect, it } from "vitest";
import type { ShiftRecord } from "../../data/types";
import { mapNeonShiftRecordToScheduleShift } from "./neonScheduleMapper";

describe("mapNeonShiftRecordToScheduleShift", () => {
  it("maps a Neon shift record into the internal schedule model", () => {
    const record: ShiftRecord = {
      createdAt: "2026-06-29T10:00:00.000Z",
      department: "Wellness",
      departmentId: "wellness",
      end: "2026-06-29T18:00:00.000Z",
      id: "shift-123",
      location: "Wellness Center",
      start: "2026-06-29T14:00:00.000Z",
      title: "Wellness Attendant",
      updatedAt: "2026-06-29T11:00:00.000Z",
      userId: "user-staff-1",
    };

    expect(mapNeonShiftRecordToScheduleShift(record)).toEqual({
      createdAt: "2026-06-29T10:00:00.000Z",
      department: "Wellness",
      departmentId: "wellness",
      end: "2026-06-29T18:00:00.000Z",
      id: "shift-123",
      location: "Wellness Center",
      start: "2026-06-29T14:00:00.000Z",
      title: "Wellness Attendant",
      updatedAt: "2026-06-29T11:00:00.000Z",
      userId: "user-staff-1",
    });
  });
});
