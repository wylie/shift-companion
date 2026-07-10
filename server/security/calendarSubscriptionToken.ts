import { createHash, randomBytes } from "node:crypto";

const CALENDAR_SUBSCRIPTION_TOKEN_BYTES = 32;

export function generateCalendarSubscriptionToken(): string {
  return randomBytes(CALENDAR_SUBSCRIPTION_TOKEN_BYTES).toString("base64url");
}

export function hashCalendarSubscriptionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
