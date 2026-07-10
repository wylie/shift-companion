import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./apiClient";

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    ...init,
  });
}

describe("calendar subscription API client routes", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    apiClient.configureSession({
      previewUserId: "user-staff-1",
      runtimeMode: "browserPreview",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the canonical GET, POST, regenerate POST, and DELETE endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ active: false }))
      .mockResolvedValueOnce(
        createJsonResponse({
          status: {
            active: true,
          },
          subscriptionUrl:
            "https://example.test/api/calendar/subscriptions/token/calendar.ics",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: {
            active: true,
          },
          subscriptionUrl:
            "https://example.test/api/calendar/subscriptions/token-2/calendar.ics",
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ active: false }));

    await apiClient.getCalendarSubscriptionStatus("user-staff-1");
    await apiClient.createCalendarSubscription("user-staff-1");
    await apiClient.regenerateCalendarSubscription("user-staff-1");
    await apiClient.revokeCalendarSubscription("user-staff-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/calendar/subscription",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/calendar/subscription",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/calendar/subscription/regenerate",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/calendar/subscription",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
