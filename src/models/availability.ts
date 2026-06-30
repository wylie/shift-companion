export type UnavailabilityRuleType =
  | "weekly-recurring"
  | "one-time-date"
  | "date-range";

export type UnavailabilityRule = {
  id: string;
  userId: string;
  type: UnavailabilityRuleType;
  note: string;
  dayOfWeek?: string;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UnavailabilityRuleInput = {
  type: UnavailabilityRuleType;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  date: string;
  startDate: string;
  endDate: string;
  note: string;
};
