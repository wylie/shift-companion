import { describe, expect, it } from "vitest";
import vercelHandler from "./[...path].ts";
import calendarSubscriptionHandler from "./calendar/subscription.ts";
import calendarSubscriptionRegenerateHandler from "./calendar/subscription/regenerate.ts";
import calendarSubscriptionFeedHandler from "./calendar/subscriptions/[token]/calendar.ics.ts";

type RouteLayer = {
  route?: {
    methods?: Record<string, boolean>;
    path?: string;
  };
};

function getRegisteredPaths() {
  const stack = (
    (vercelHandler as unknown as { router?: { stack?: RouteLayer[] } }).router
      ?.stack ?? []
  ) as RouteLayer[];

  return stack
    .filter((layer) => layer.route?.path)
    .map((layer) => layer.route?.path ?? "");
}

describe("Vercel API handler", () => {
  it("reuses the shared handler for the nested calendar subscription entry points", () => {
    expect(calendarSubscriptionHandler).toBe(vercelHandler);
    expect(calendarSubscriptionRegenerateHandler).toBe(vercelHandler);
    expect(calendarSubscriptionFeedHandler).toBe(vercelHandler);
  });

  it("includes the calendar subscription management route", () => {
    expect(getRegisteredPaths()).toContain("/api/calendar/subscription");
    expect(getRegisteredPaths()).toContain("/api/calendar/subscription/regenerate");
  });

  it("includes the public calendar subscription feed route", () => {
    expect(getRegisteredPaths()).toContain(
      "/api/calendar/subscriptions/:token/calendar.ics",
    );
  });
});
