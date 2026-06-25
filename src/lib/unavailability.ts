import type { UnavailabilityRule } from "../types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

export function getRuleDays(rule: UnavailabilityRule): string[] {
  if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    return rule.daysOfWeek.filter(Boolean);
  }

  return rule.dayOfWeek ? [rule.dayOfWeek] : [];
}

export function normalizeDateOnlyValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const matchedDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (matchedDate) {
    return `${matchedDate[1]}-${matchedDate[2]}-${matchedDate[3]}`;
  }

  const parsed = new Date(trimmed);

  if (!isValidDate(parsed)) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10);
}

export function normalizeTimeValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const matchedTime = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);

  if (!matchedTime) {
    return undefined;
  }

  const hours = Number(matchedTime[1]);
  const minutes = Number(matchedTime[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return undefined;
  }

  return `${matchedTime[1]}:${matchedTime[2]}`;
}

export function normalizeUnavailabilityRule(
  rule: UnavailabilityRule,
): UnavailabilityRule {
  const daysOfWeek = getRuleDays(rule);

  return {
    ...rule,
    date: normalizeDateOnlyValue(rule.date),
    dayOfWeek: daysOfWeek[0],
    daysOfWeek,
    endDate: normalizeDateOnlyValue(rule.endDate),
    endTime: normalizeTimeValue(rule.endTime),
    startDate: normalizeDateOnlyValue(rule.startDate),
    startTime: normalizeTimeValue(rule.startTime),
  };
}

export function formatUnavailabilityDate(value: string | undefined): string {
  const normalizedValue = normalizeDateOnlyValue(value);

  if (!normalizedValue) {
    return "Date not set";
  }

  const parsed = new Date(`${normalizedValue}T12:00:00`);

  if (!isValidDate(parsed)) {
    return "Date not set";
  }

  return dateFormatter.format(parsed);
}

export function formatUnavailabilityTime(value: string | undefined): string {
  const normalizedValue = normalizeTimeValue(value);

  if (!normalizedValue) {
    return "Time not set";
  }

  const parsed = new Date(`2026-01-01T${normalizedValue}:00`);

  if (!isValidDate(parsed)) {
    return "Time not set";
  }

  return timeFormatter.format(parsed);
}

function formatDayAbbreviation(day: string): string {
  return day.slice(0, 3);
}

export function formatUnavailabilityRuleSummary(rule: UnavailabilityRule): string {
  const normalizedRule = normalizeUnavailabilityRule(rule);

  if (normalizedRule.type === "weekly-recurring") {
    const days = getRuleDays(normalizedRule)
      .map(formatDayAbbreviation)
      .join(", ");

    if (!days) {
      return "Recurring unavailable time";
    }

    return `Every ${days}, ${formatUnavailabilityTime(
      normalizedRule.startTime,
    )}-${formatUnavailabilityTime(normalizedRule.endTime)}`;
  }

  if (normalizedRule.type === "one-time-date") {
    return `${formatUnavailabilityDate(
      normalizedRule.date,
    )}, ${formatUnavailabilityTime(
      normalizedRule.startTime,
    )}-${formatUnavailabilityTime(normalizedRule.endTime)}`;
  }

  return `${formatUnavailabilityDate(
    normalizedRule.startDate,
  )} to ${formatUnavailabilityDate(normalizedRule.endDate)}`;
}
