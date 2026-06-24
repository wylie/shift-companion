import { describe, expect, it } from "vitest";
import {
  shifts,
  staffMembers,
  teams,
  unavailabilityRules,
} from "../data/mockData";
import { detectManagerConflicts, ruleConflictsWithShift } from "./conflicts";
import { addDays, startOfWeek } from "./date";

describe("ruleConflictsWithShift", () => {
  it("matches weekly recurring unavailable times when shift times overlap", () => {
    const rule = unavailabilityRules.find((item) => item.id === "ua-6");
    const shift = shifts.find((item) => item.id === "shift-6");

    expect(rule && shift ? ruleConflictsWithShift(rule, shift) : false).toBe(
      true,
    );
  });

  it("matches date range unavailable rules across full-day windows", () => {
    const rule = unavailabilityRules.find((item) => item.id === "ua-5");
    const shift = shifts.find((item) => item.id === "shift-4");

    expect(rule && shift ? ruleConflictsWithShift(rule, shift) : false).toBe(
      true,
    );
  });
});

describe("detectManagerConflicts", () => {
  it("returns only conflicts for the selected department and week", () => {
    const weekStart = startOfWeek(new Date("2026-06-24T12:00:00"));
    const weekEnd = addDays(weekStart, 7);

    const results = detectManagerConflicts({
      departmentId: "membership",
      shifts,
      staffMembers,
      teams,
      unavailabilityRules,
      weekStart,
      weekEnd,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.staff.name).toBe("Taylor Gomez");
    expect(results[0]?.shift.title).toBe("Membership Support");
  });
});
