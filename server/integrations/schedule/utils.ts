import { isWithinRange, parseLocalDateTime } from "../../../src/lib/date";
import type { Shift } from "../../../src/types";

export function filterShiftsByRange(
  shifts: Shift[],
  params: { endDate: Date; startDate: Date },
): Shift[] {
  return shifts
    .filter((shift) =>
      isWithinRange(
        parseLocalDateTime(shift.start),
        params.startDate,
        params.endDate,
      ),
    )
    .sort((left, right) => left.start.localeCompare(right.start));
}
