import type {
  CurrentUser,
  Shift,
  StaffConflict,
  StaffMember,
  Team,
  UnavailabilityRule,
} from "../types";

export const teams: Team[] = [
  { id: "wellness", name: "Wellness", managerIds: ["user-manager-1"] },
  { id: "membership", name: "Membership", managerIds: ["user-manager-1"] },
  { id: "child-watch", name: "Child Watch", managerIds: ["user-manager-1"] },
  { id: "facilities", name: "Facilities", managerIds: ["user-manager-2"] },
];

export const currentUsers: Record<"staff" | "manager", CurrentUser> = {
  staff: {
    id: "user-staff-1",
    name: "Jordan Lee",
    role: "staff",
    teamIds: ["wellness"],
  },
  manager: {
    id: "user-manager-1",
    name: "Avery Patel",
    role: "manager",
    teamIds: ["wellness", "membership", "child-watch"],
  },
};

export const staffMembers: StaffMember[] = [
  { id: "user-staff-1", name: "Jordan Lee", teamId: "wellness", role: "staff" },
  {
    id: "user-staff-2",
    name: "Taylor Gomez",
    teamId: "membership",
    role: "staff",
  },
  {
    id: "user-staff-3",
    name: "Morgan Chen",
    teamId: "child-watch",
    role: "staff",
  },
];

export const unavailabilityRules: UnavailabilityRule[] = [
  {
    id: "ua-1",
    userId: "user-staff-1",
    type: "weekly-recurring",
    dayOfWeek: "Monday",
    startTime: "16:00",
    endTime: "20:00",
    note: "Evening class schedule.",
  },
  {
    id: "ua-2",
    userId: "user-staff-1",
    type: "one-time-date",
    date: "2026-07-03",
    startTime: "09:00",
    endTime: "13:00",
    note: "Family appointment.",
  },
  {
    id: "ua-3",
    userId: "user-staff-1",
    type: "date-range",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    note: "Summer break week.",
  },
];

export const shifts: Shift[] = [
  {
    id: "shift-1",
    userId: "user-staff-1",
    title: "Wellness Attendant",
    day: "Mon, Jun 29",
    timeRange: "6:00 AM - 2:00 PM",
    location: "Wellness Center",
  },
  {
    id: "shift-2",
    userId: "user-staff-1",
    title: "Front Desk Coverage",
    day: "Wed, Jul 1",
    timeRange: "3:00 PM - 7:00 PM",
    location: "Main Welcome Desk",
  },
  {
    id: "shift-3",
    userId: "user-staff-2",
    title: "Membership Support",
    day: "Fri, Jul 3",
    timeRange: "9:00 AM - 1:00 PM",
    location: "Member Services",
  },
  {
    id: "shift-4",
    userId: "user-staff-3",
    title: "Child Watch",
    day: "Thu, Jul 2",
    timeRange: "8:00 AM - 12:00 PM",
    location: "Child Watch Room",
  },
];

export const staffConflicts: StaffConflict[] = [
  {
    id: "conflict-1",
    teamId: "wellness",
    staffId: "user-staff-1",
    shiftId: "shift-2",
    summary: "Scheduled during a recurring evening unavailable block.",
    severity: "high",
  },
  {
    id: "conflict-2",
    teamId: "child-watch",
    staffId: "user-staff-3",
    shiftId: "shift-4",
    summary: "Potential overlap with a one-time unavailable date.",
    severity: "medium",
  },
];
