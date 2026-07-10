import { createHash } from "node:crypto";
import type { Shift } from "../types";
import { parseLocalDateTime, toIcsDateTime } from "./date";

type CalendarExportOptions = {
  calendarName?: string;
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

function buildStableShiftUid(shift: Shift): string {
  const hash = createHash("sha256")
    .update(`${shift.userId}:${shift.id}`)
    .digest("hex");

  return `${hash}@teams-shifts-companion.local`;
}

export function buildCalendarIcs(
  shifts: Shift[],
  options: CalendarExportOptions = {},
): string {
  const calendarName = options.calendarName ?? "My Teams Shifts Schedule";
  const generatedAt = options.generatedAt ?? new Date();
  const productId = options.productId ?? "-//Teams Shifts Companion//EN";

  const events = shifts
    .slice()
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((shift) => {
      const start = parseLocalDateTime(shift.start);
      const end = parseLocalDateTime(shift.end);
      const lastModified = shift.updatedAt
        ? parseLocalDateTime(shift.updatedAt)
        : generatedAt;

      const lines = [
        "BEGIN:VEVENT",
        foldIcsLine(`UID:${buildStableShiftUid(shift)}`),
        foldIcsLine(`DTSTAMP:${toIcsDateTime(lastModified)}`),
        foldIcsLine(`DTSTART:${toIcsDateTime(start)}`),
        foldIcsLine(`DTEND:${toIcsDateTime(end)}`),
        foldIcsLine(`LAST-MODIFIED:${toIcsDateTime(lastModified)}`),
        foldIcsLine(`SUMMARY:${escapeIcsText(shift.title)}`),
        "END:VEVENT",
      ];

      if (shift.location) {
        lines.splice(
          lines.length - 1,
          0,
          foldIcsLine(`LOCATION:${escapeIcsText(shift.location)}`),
        );
      }

      return lines.join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    foldIcsLine("VERSION:2.0"),
    foldIcsLine(`PRODID:${productId}`),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldIcsLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`),
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
