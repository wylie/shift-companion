const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const shortDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function parseLocalDateTime(value: string): Date {
  return new Date(value);
}

export function startOfWeek(value: Date): Date {
  const result = new Date(value);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

export function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(value: Date, weeks: number): Date {
  return addDays(value, weeks * 7);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isWithinRange(
  value: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return value >= rangeStart && value < rangeEnd;
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  if (sameMonth && sameYear) {
    return `${weekStart.toLocaleDateString("en-US", {
      month: "long",
    })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
  }

  return `${dateFormatter.format(weekStart)} - ${dateFormatter.format(weekEnd)}`;
}

export function formatDayLabel(value: Date): string {
  return dayFormatter.format(value);
}

export function formatShortDayLabel(value: Date): string {
  return shortDayFormatter.format(value);
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${timeFormatter.format(start)}-${timeFormatter.format(end)}`;
}

export function formatDateLabel(value: Date): string {
  return dateFormatter.format(value);
}

export function toIcsDateTime(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");
  const seconds = String(value.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
