import type { Shift } from "../../../src/models/schedule.js";
import type { ShiftRecord } from "../../data/types.js";

export function mapNeonShiftRecordToScheduleShift(record: ShiftRecord): Shift {
  return {
    createdAt: record.createdAt,
    department: record.department,
    departmentId: record.departmentId,
    end: record.end,
    id: record.id,
    location: record.location,
    start: record.start,
    title: record.title,
    updatedAt: record.updatedAt,
    userId: record.userId,
  };
}

export function mapNeonShiftRecordsToScheduleShifts(
  records: ShiftRecord[],
): Shift[] {
  return records.map(mapNeonShiftRecordToScheduleShift);
}
