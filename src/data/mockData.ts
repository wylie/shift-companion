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
    department: "Wellness",
    start: "2026-06-22T06:00:00",
    end: "2026-06-22T14:00:00",
    location: "Wellness Center",
  },
  {
    id: "shift-2",
    userId: "user-staff-1",
    title: "Front Desk Coverage",
    department: "Front Desk",
    start: "2026-06-24T15:00:00",
    end: "2026-06-24T19:00:00",
    location: "Main Welcome Desk",
  },
  {
    id: "shift-3",
    userId: "user-staff-2",
    title: "Membership Support",
    department: "Membership",
    start: "2026-06-26T09:00:00",
    end: "2026-06-26T13:00:00",
    location: "Member Services",
  },
  {
    id: "shift-4",
    userId: "user-staff-3",
    title: "Child Watch",
    department: "Child Watch",
    start: "2026-06-25T08:00:00",
    end: "2026-06-25T12:00:00",
    location: "Child Watch Room",
  },
  {
    id: "shift-5",
    userId: "user-staff-1",
    title: "Membership Welcome Desk",
    department: "Membership",
    start: "2026-06-26T10:00:00",
    end: "2026-06-26T16:00:00",
    location: "Member Services",
  },
  {
    id: "shift-6",
    userId: "user-staff-1",
    title: "Wellness Floor Support",
    department: "Wellness",
    start: "2026-06-30T07:00:00",
    end: "2026-06-30T13:00:00",
    location: "Strength Floor",
  },
  {
    id: "shift-7",
    userId: "user-staff-1",
    title: "Facilities Check-In",
    department: "Facilities",
    start: "2026-07-02T12:00:00",
    end: "2026-07-02T18:00:00",
    location: "Operations Office",
  },
  {
    id: "shift-8",
    userId: "user-staff-1",
    title: "Front Desk Closing",
    department: "Front Desk",
    start: "2026-07-08T14:00:00",
    end: "2026-07-08T20:00:00",
    location: "Main Welcome Desk",
  },
  {
    id: "shift-9",
    userId: "user-staff-1",
    title: "Child Watch Support",
    department: "Child Watch",
    start: "2026-07-10T09:00:00",
    end: "2026-07-10T12:00:00",
    location: "Child Watch Room",
  },
  {
    id: "shift-10",
    userId: "user-staff-1",
    title: "Wellness Orientation",
    department: "Wellness",
    start: "2026-07-14T08:30:00",
    end: "2026-07-14T12:30:00",
    location: "Studio B",
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
