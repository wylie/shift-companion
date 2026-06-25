import { describe, expect, it } from "vitest";
import {
  formatUnavailabilityDate,
  formatUnavailabilityRuleSummary,
  normalizeTimeValue,
  normalizeUnavailabilityRule,
} from "./unavailability";

describe("normalizeUnavailabilityRule", () => {
  it("normalizes persisted postgres-style date and time values", () => {
    const normalized = normalizeUnavailabilityRule({
      id: "rule-1",
      userId: "user-1",
      type: "one-time-date",
      note: "",
      date: "2026-07-03T00:00:00.000Z",
      startTime: "09:00:00",
      endTime: "13:30:00",
    });

    expect(normalized.date).toBe("2026-07-03");
    expect(normalized.startTime).toBe("09:00");
    expect(normalized.endTime).toBe("13:30");
  });
});

describe("formatting unavailability rules", () => {
  it("supports weekly recurring multi-day summaries without touching date fields", () => {
    const summary = formatUnavailabilityRuleSummary({
      id: "rule-2",
      userId: "user-1",
      type: "weekly-recurring",
      note: "",
      daysOfWeek: ["Monday", "Wednesday", "Thursday", "Friday"],
      startTime: "08:00:00",
      endTime: "11:00:00",
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });

    expect(summary).toBe("Every Mon, Wed, Thu, Fri, 8:00 AM-11:00 AM");
  });

  it("falls back safely when one-time dates are missing or invalid", () => {
    const summary = formatUnavailabilityRuleSummary({
      id: "rule-3",
      userId: "user-1",
      type: "one-time-date",
      note: "",
      date: "not-a-date",
      startTime: "09:00:00",
      endTime: "12:00:00",
    });

    expect(summary).toBe("Date not set, 9:00 AM-12:00 PM");
  });

  it("falls back safely for invalid date ranges", () => {
    const summary = formatUnavailabilityRuleSummary({
      id: "rule-4",
      userId: "user-1",
      type: "date-range",
      note: "",
      startDate: undefined,
      endDate: "not-a-date",
    });

    expect(summary).toBe("Date not set to Date not set");
  });
});

describe("normalizeTimeValue", () => {
  it("accepts postgres time values with seconds", () => {
    expect(normalizeTimeValue("09:00:00")).toBe("09:00");
  });

  it("rejects malformed values", () => {
    expect(normalizeTimeValue("25:99:00")).toBeUndefined();
  });
});

describe("formatUnavailabilityDate", () => {
  it("returns a fallback for missing values", () => {
    expect(formatUnavailabilityDate(undefined)).toBe("Date not set");
  });
});
