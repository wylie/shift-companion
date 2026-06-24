import { describe, expect, it } from "vitest";
import { mockUsers, teams } from "../data/mockData";
import {
  canAccessManagerView,
  getManagedDepartments,
  getVisibleNavItems,
} from "./access";

const navItems = [
  { id: "unavailability", label: "My Unavailability" },
  { id: "schedule", label: "My Schedule" },
  { id: "manager", label: "Manager View" },
  { id: "settings", label: "Settings / Privacy" },
] as const;

describe("access helpers", () => {
  it("hides manager navigation for staff identities", () => {
    const visible = getVisibleNavItems(navItems as never, mockUsers[0]!);
    expect(visible.map((item) => item.id)).not.toContain("manager");
  });

  it("allows manager identities to access only assigned departments", () => {
    const departments = getManagedDepartments(mockUsers[2]!, teams);
    expect(departments.map((department) => department.name)).toEqual([
      "Front Desk",
      "Membership",
    ]);
  });

  it("detects manager access from the selected mocked identity", () => {
    expect(canAccessManagerView(mockUsers[1]!)).toBe(true);
    expect(canAccessManagerView(mockUsers[0]!)).toBe(false);
  });
});
