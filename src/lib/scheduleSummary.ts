import type { Shift } from "../models/schedule.js";
import { isSameDay, parseLocalDateTime } from "./date.js";

export type ScheduleSummary = {
  nextShift: Shift | null;
  todayShifts: Shift[];
};

function sortShiftsByStart(shifts: Shift[]): Shift[] {
  return shifts
    .slice()
    .sort((left, right) => left.start.localeCompare(right.start));
}

export function getTodayShifts(shifts: Shift[], now: Date): Shift[] {
  return sortShiftsByStart(shifts).filter((shift) =>
    isSameDay(parseLocalDateTime(shift.start), now),
  );
}

export function getNextShift(shifts: Shift[], now: Date): Shift | null {
  // Treat the next shift as the earliest shift that has not finished yet, so
  // an in-progress shift still appears until its local end time passes.
  return (
    sortShiftsByStart(shifts).find(
      (shift) => parseLocalDateTime(shift.end).getTime() > now.getTime(),
    ) ?? null
  );
}

export function buildScheduleSummary(
  shifts: Shift[],
  now: Date,
): ScheduleSummary {
  return {
    nextShift: getNextShift(shifts, now),
    todayShifts: getTodayShifts(shifts, now),
  };
}
