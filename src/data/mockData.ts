import type {
  CurrentUser,
  Shift,
  StaffConflict,
  StaffMember,
  Team,
  UnavailabilityRule,
} from "../types";

export const teams: Team[] = [
  { id: "aquatics", name: "Aquatics", managerIds: ["user-manager-1"] },
  { id: "wellness", name: "Wellness", managerIds: ["user-manager-1"] },
];

export const currentUsers: Record<"staff" | "manager", CurrentUser> = {
  staff: {
    id: "user-staff-1",
    name: "Jordan Lee",
    role: "staff",
    teamIds: ["aquatics"],
  },
  manager: {
    id: "user-manager-1",
    name: "Avery Patel",
    role: "manager",
    teamIds: ["aquatics", "wellness"],
  },
};

export const staffMembers: StaffMember[] = [
  { id: "user-staff-1", name: "Jordan Lee", teamId: "aquatics", role: "staff" },
  {
    id: "user-staff-2",
    name: "Taylor Gomez",
    teamId: "aquatics",
    role: "staff",
  },
  {
    id: "user-staff-3",
    name: "Morgan Chen",
    teamId: "wellness",
    role: "staff",
  },
];

export const unavailabilityRules: UnavailabilityRule[] = [
  {
    id: "ua-1",
    userId: "user-staff-1",
    title: "Class schedule",
    recurrence: "Every Monday and Wednesday after 4:00 PM",
    notes: "Placeholder recurring block for evenings.",
  },
  {
    id: "ua-2",
    userId: "user-staff-1",
    title: "Childcare",
    recurrence: "Every Friday before 1:00 PM",
    notes: "Will later support start/end bounds and exceptions.",
  },
];

export const shifts: Shift[] = [
  {
    id: "shift-1",
    userId: "user-staff-1",
    title: "Lifeguard",
    day: "Mon, Jun 29",
    timeRange: "6:00 AM - 2:00 PM",
    location: "Downtown Pool",
  },
  {
    id: "shift-2",
    userId: "user-staff-1",
    title: "Swim Lessons",
    day: "Wed, Jul 1",
    timeRange: "3:00 PM - 7:00 PM",
    location: "Family Aquatic Center",
  },
  {
    id: "shift-3",
    userId: "user-staff-2",
    title: "Front Desk",
    day: "Fri, Jul 3",
    timeRange: "9:00 AM - 1:00 PM",
    location: "Downtown Pool",
  },
];

export const staffConflicts: StaffConflict[] = [
  {
    id: "conflict-1",
    teamId: "aquatics",
    staffId: "user-staff-1",
    shiftId: "shift-2",
    summary: "Scheduled during recurring Wednesday unavailability.",
    severity: "high",
  },
  {
    id: "conflict-2",
    teamId: "wellness",
    staffId: "user-staff-3",
    shiftId: "shift-4",
    summary: "Potential overlap with training block.",
    severity: "medium",
  },
];
