export const calendarDownloadPath = "/api/calendar.ics";

export const calendarSubscriptionStatusPath = "/api/calendar/subscription";
export const calendarSubscriptionCreatePath = "/api/calendar/subscription";
export const calendarSubscriptionRegeneratePath =
  "/api/calendar/subscription/regenerate";
export const calendarSubscriptionRevokePath = "/api/calendar/subscription";
export const calendarSubscriptionFeedRoutePath =
  "/api/calendar/subscriptions/:token/calendar.ics";

export function buildCalendarSubscriptionFeedPath(rawToken: string): string {
  return `/api/calendar/subscriptions/${encodeURIComponent(rawToken)}/calendar.ics`;
}
