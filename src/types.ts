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
  day: string;
  timeRange: string;
  location: string;
};

export type StaffConflict = {
  id: string;
  teamId: string;
  staffId: string;
  shiftId: string;
  summary: string;
  severity: "low" | "medium" | "high";
};

export type NavItem = {
  id: "unavailability" | "schedule" | "manager" | "settings";
  label: string;
};
