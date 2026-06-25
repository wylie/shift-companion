import type {
  CurrentUser,
  DepartmentMembership,
  NavItem,
  Team,
} from "../types";

export function canAccessManagerView(user: CurrentUser): boolean {
  return user.role === "manager";
}

export function canViewOwnSchedule(
  actor: CurrentUser,
  requestedUserId: string,
): boolean {
  return actor.id === requestedUserId;
}

export function canManageOwnUnavailability(
  actor: CurrentUser,
  requestedUserId: string,
): boolean {
  return actor.id === requestedUserId;
}

export function canDownloadOwnCalendar(
  actor: CurrentUser,
  requestedUserId: string,
): boolean {
  return actor.id === requestedUserId;
}

export function canViewManagerDepartment(
  actor: CurrentUser,
  departmentId: string,
  memberships: DepartmentMembership[],
): boolean {
  if (!canAccessManagerView(actor)) {
    return false;
  }

  return memberships.some(
    (membership) =>
      membership.userId === actor.id &&
      membership.role === "manager" &&
      membership.departmentId === departmentId,
  );
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
