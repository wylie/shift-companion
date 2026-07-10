import { describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>(
    "node:crypto",
  );

  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.alloc(32, 7)),
  };
});

import {
  generateCalendarSubscriptionToken,
  hashCalendarSubscriptionToken,
} from "./calendarSubscriptionToken";

describe("calendar subscription tokens", () => {
  it("uses secure random bytes to generate URL-safe tokens", () => {
    const token = generateCalendarSubscriptionToken();

    expect(token).toBe(Buffer.alloc(32, 7).toString("base64url"));
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes tokens before storage", () => {
    const hash = hashCalendarSubscriptionToken("private-token");

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe("private-token");
  });
});
