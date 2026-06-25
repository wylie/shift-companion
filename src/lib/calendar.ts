import type { Shift } from "../types";
import { parseLocalDateTime, toIcsDateTime } from "./date";

type CalendarExportOptions = {
  generatedAt?: Date;
  productId?: string;
};

function foldIcsLine(value: string): string {
  const maxLength = 75;

  if (value.length <= maxLength) {
    return value;
  }

  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += maxLength) {
    const chunk = value.slice(index, index + maxLength);
    chunks.push(index === 0 ? chunk : ` ${chunk}`);
  }

  return chunks.join("\r\n");
}

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
        foldIcsLine(`UID:${shift.id}@teams-shifts-companion.local`),
        foldIcsLine(`DTSTAMP:${toIcsDateTime(generatedAt)}`),
        foldIcsLine(`DTSTART:${toIcsDateTime(start)}`),
        foldIcsLine(`DTEND:${toIcsDateTime(end)}`),
        foldIcsLine(`SUMMARY:${escapeIcsText(shift.title)}`),
        foldIcsLine(`LOCATION:${escapeIcsText(shift.location)}`),
        "END:VEVENT",
      ].join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    foldIcsLine("VERSION:2.0"),
    foldIcsLine(`PRODID:${productId}`),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
