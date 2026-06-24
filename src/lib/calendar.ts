import type { Shift } from "../types";
import { parseLocalDateTime, toIcsDateTime } from "./date";

type CalendarExportOptions = {
  generatedAt?: Date;
  productId?: string;
};

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildCalendarIcs(
  shifts: Shift[],
  options: CalendarExportOptions = {},
): string {
  const generatedAt = options.generatedAt ?? new Date();
  const productId = options.productId ?? "-//Teams Shifts Companion//EN";

  const events = shifts
    .slice()
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((shift) => {
      const start = parseLocalDateTime(shift.start);
      const end = parseLocalDateTime(shift.end);

      return [
        "BEGIN:VEVENT",
        `UID:${shift.id}@teams-shifts-companion.local`,
        `DTSTAMP:${toIcsDateTime(generatedAt)}`,
        `DTSTART:${toIcsDateTime(start)}`,
        `DTEND:${toIcsDateTime(end)}`,
        `SUMMARY:${escapeIcsText(shift.title)}`,
        `LOCATION:${escapeIcsText(shift.location)}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${productId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
