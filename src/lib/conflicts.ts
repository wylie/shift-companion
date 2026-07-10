import type { Shift, StaffMember, Team, UnavailabilityRule } from "../types.js";
import {
  formatDateLabel,
  formatTimeRange,
  isWithinRange,
  parseLocalDateTime,
} from "./date.js";
import {
  formatUnavailabilityRuleSummary,
  getRuleDays,
  normalizeUnavailabilityRule,
} from "./unavailability.js";

export type ManagerConflict = {
  id: string;
  departmentId: string;
  departmentName: string;
  staff: StaffMember;
  shift: Shift;
  rule: UnavailabilityRule;
  ruleSummary: string;
};

function getDayName(value: Date): string {
  return value.toLocaleDateString("en-US", { weekday: "long" });
}

function parseTimeToMinutes(value?: string): number | null {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function shiftOverlapsTimeRange(
  shiftStart: Date,
  shiftEnd: Date,
  startTime?: string,
  endTime?: string,
): boolean {
  const rangeStart = parseTimeToMinutes(startTime);
  const rangeEnd = parseTimeToMinutes(endTime);

  if (rangeStart === null || rangeEnd === null) {
    return false;
  }

  const shiftStartMinutes =
    shiftStart.getHours() * 60 + shiftStart.getMinutes();
  const shiftEndMinutes = shiftEnd.getHours() * 60 + shiftEnd.getMinutes();

  return shiftStartMinutes < rangeEnd && shiftEndMinutes > rangeStart;
}

export function formatUnavailabilityRule(rule: UnavailabilityRule): string {
  return formatUnavailabilityRuleSummary(rule);
}

export function ruleConflictsWithShift(
  rule: UnavailabilityRule,
  shift: Shift,
): boolean {
  const normalizedRule = normalizeUnavailabilityRule(rule);
  const shiftStart = parseLocalDateTime(shift.start);
  const shiftEnd = parseLocalDateTime(shift.end);
  const shiftDate = shift.start.slice(0, 10);

  if (normalizedRule.type === "weekly-recurring") {
    return (
      getRuleDays(normalizedRule).includes(getDayName(shiftStart)) &&
      shiftOverlapsTimeRange(
        shiftStart,
        shiftEnd,
        normalizedRule.startTime,
        normalizedRule.endTime,
      )
    );
  }

  if (normalizedRule.type === "one-time-date") {
    return (
      normalizedRule.date === shiftDate &&
      shiftOverlapsTimeRange(
        shiftStart,
        shiftEnd,
        normalizedRule.startTime,
        normalizedRule.endTime,
      )
    );
  }

  if (!normalizedRule.startDate || !normalizedRule.endDate) {
    return false;
  }

  return (
    shiftDate >= normalizedRule.startDate && shiftDate <= normalizedRule.endDate
  );
}

export function detectManagerConflicts(params: {
  departmentId: string;
  shifts: Shift[];
  staffMembers: StaffMember[];
  teams: Team[];
  unavailabilityRules: UnavailabilityRule[];
  weekStart: Date;
  weekEnd: Date;
}): ManagerConflict[] {
  const {
    departmentId,
    shifts,
    staffMembers,
    teams,
    unavailabilityRules,
    weekStart,
    weekEnd,
  } = params;
  const team = teams.find((item) => item.id === departmentId);

  if (!team) {
    return [];
  }

  const staffById = new Map(staffMembers.map((member) => [member.id, member]));
  const rulesByUserId = new Map<string, UnavailabilityRule[]>();

  unavailabilityRules.forEach((rule) => {
    const nextRules = rulesByUserId.get(rule.userId) ?? [];
    nextRules.push(rule);
    rulesByUserId.set(rule.userId, nextRules);
  });

  return shifts
    .filter(
      (shift) =>
        shift.department === team.name &&
        isWithinRange(parseLocalDateTime(shift.start), weekStart, weekEnd),
    )
    .flatMap((shift) => {
      const staff = staffById.get(shift.userId);

      if (!staff) {
        return [];
      }

      return (rulesByUserId.get(shift.userId) ?? [])
        .filter((rule) => ruleConflictsWithShift(rule, shift))
        .map((rule) => ({
          id: `${shift.id}-${rule.id}`,
          departmentId: team.id,
          departmentName: team.name,
          staff,
          shift,
          rule,
          ruleSummary: formatUnavailabilityRule(rule),
        }));
    });
}

export function formatManagerConflictTiming(shift: Shift): string {
  const start = parseLocalDateTime(shift.start);
  const end = parseLocalDateTime(shift.end);
  return `${formatDateLabel(start)} • ${formatTimeRange(start, end)}`;
}
