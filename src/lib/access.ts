import type { CurrentUser, NavItem, Team } from "../types";

export function canAccessManagerView(user: CurrentUser): boolean {
  return user.role === "manager";
}

export function getManagedDepartments(
  user: CurrentUser,
  teams: Team[],
): Team[] {
  if (!canAccessManagerView(user)) {
    return [];
  }

  return teams.filter((team) => user.teamIds.includes(team.id));
}

export function getVisibleNavItems(
  navItems: NavItem[],
  user: CurrentUser,
): NavItem[] {
  return canAccessManagerView(user)
    ? navItems
    : navItems.filter((item) => item.id !== "manager");
}
