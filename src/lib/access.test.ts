import { describe, expect, it } from "vitest";
import { departments, mockUsers } from "../data/mockData";
import {
  canAccessManagerView,
  canDownloadOwnCalendar,
  canManageOwnUnavailability,
  canViewOwnSchedule,
  getManagedDepartments,
  getVisibleNavItems,
} from "./access";

const navItems = [
  { id: "schedule", label: "My Schedule" },
  { id: "calendar", label: "Calendar" },
  { id: "settings", label: "Settings" },
  { id: "feedback", label: "Feedback" },
  { id: "manager", label: "Manager Review" },
] as const;

describe("access helpers", () => {
  it("hides manager navigation for staff identities", () => {
    const visible = getVisibleNavItems(navItems as never, mockUsers[0]!);
    expect(visible.map((item) => item.id)).not.toContain("manager");
  });

  it("allows manager identities to access only assigned departments", () => {
    const managedDepartments = getManagedDepartments(
      mockUsers[2]!,
      departments,
    );
    expect(managedDepartments.map((department) => department.name)).toEqual([
      "Front Desk",
      "Membership",
    ]);
  });

  it("detects manager access from the selected mocked identity", () => {
    expect(canAccessManagerView(mockUsers[1]!)).toBe(true);
    expect(canAccessManagerView(mockUsers[0]!)).toBe(false);
  });

  it("keeps staff routes current-user-only", () => {
    expect(canViewOwnSchedule(mockUsers[0]!, "user-staff-1")).toBe(true);
    expect(canManageOwnUnavailability(mockUsers[0]!, "user-staff-1")).toBe(
      true,
    );
    expect(canDownloadOwnCalendar(mockUsers[0]!, "user-staff-1")).toBe(true);
    expect(canViewOwnSchedule(mockUsers[0]!, "user-staff-2")).toBe(false);
    expect(canManageOwnUnavailability(mockUsers[0]!, "user-staff-2")).toBe(
      false,
    );
    expect(canDownloadOwnCalendar(mockUsers[0]!, "user-staff-2")).toBe(false);
  });
});
