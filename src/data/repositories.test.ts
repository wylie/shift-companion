import { describe, expect, it } from "vitest";
import { createMockRepositories } from "./repositories";

describe("mock repositories", () => {
  it("lists assigned departments through memberships", () => {
    const repositories = createMockRepositories();
    const departments = repositories.departments.listForUser("user-manager-2");

    expect(departments.map((department) => department.name)).toEqual([
      "Front Desk",
      "Membership",
    ]);
  });

  it("persists unavailability changes in memory for the current preview session", () => {
    const repositories = createMockRepositories();
    const rule = {
      id: "ua-temp",
      userId: "user-staff-1",
      type: "weekly-recurring" as const,
      dayOfWeek: "Thursday",
      startTime: "18:00",
      endTime: "20:00",
      note: "Demo repository save.",
    };

    repositories.unavailabilityRules.save(rule);

    const savedRules =
      repositories.unavailabilityRules.listForUser("user-staff-1");
    expect(savedRules.some((savedRule) => savedRule.id === "ua-temp")).toBe(
      true,
    );

    repositories.unavailabilityRules.delete("ua-temp");

    const remainingRules =
      repositories.unavailabilityRules.listForUser("user-staff-1");
    expect(remainingRules.some((savedRule) => savedRule.id === "ua-temp")).toBe(
      false,
    );
  });
});
