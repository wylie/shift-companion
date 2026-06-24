export type UserRole = "staff" | "manager";

export type CurrentUser = {
  id: string;
  name: string;
  role: UserRole;
  teamIds: string[];
};

export type Team = {
  id: string;
  name: string;
  managerIds: string[];
};

export type DepartmentMembership = {
  id: string;
  userId: string;
  departmentId: string;
  role: "staff" | "manager";
};

export type StaffMember = {
  id: string;
  name: string;
  teamId: string;
  role: "staff";
};

export type UnavailabilityRuleType =
  | "weekly-recurring"
  | "one-time-date"
  | "date-range";

export type UnavailabilityRule = {
  id: string;
  userId: string;
  type: UnavailabilityRuleType;
  note: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
};

export type Shift = {
  id: string;
  userId: string;
  title: string;
  department?: string;
  start: string;
  end: string;
  location: string;
};

export type NavItem = {
  id: "unavailability" | "schedule" | "manager" | "settings";
  label: string;
};

export type AuditEvent = {
  id: string;
  actorUserId: string;
  timestamp: string;
  summary: string;
};
