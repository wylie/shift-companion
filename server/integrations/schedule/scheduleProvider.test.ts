import { describe, expect, it } from "vitest";
import { buildAppConfig } from "../../config";
import { createMockDataAccess } from "../../data/mockDataAccess";
import { createScheduleProvider } from "./index";
import { createMicrosoftGraphScheduleProvider } from "./microsoftGraphScheduleProvider";

describe("createScheduleProvider", () => {
  it('defaults to the Neon/demo provider when SCHEDULE_PROVIDER is missing', async () => {
    const provider = createScheduleProvider({
      config: buildAppConfig({
        PORT: "8787",
      }),
      dataAccess: createMockDataAccess(),
    });

    await expect(provider.getProviderStatus()).resolves.toEqual({
      availability: "available",
      message:
        "Using the persisted Neon/demo schedule provider backed by the current repository layer.",
      providerId: "neon-demo",
    });
  });
});

describe("createMicrosoftGraphScheduleProvider", () => {
  it("returns a safe not-configured result without making external calls", async () => {
    const provider = createMicrosoftGraphScheduleProvider();

    await expect(provider.getProviderStatus()).resolves.toEqual({
      availability: "not_configured",
      message:
        "Microsoft Graph / Teams Shifts schedule integration is intentionally stubbed in Phase 6A and is not configured yet.",
      providerId: "microsoft-graph",
    });

    await expect(
      provider.getCurrentUserScheduleRange({
        endDate: new Date("2026-06-29T00:00:00"),
        startDate: new Date("2026-06-22T00:00:00"),
        userId: "user-staff-1",
      }),
    ).resolves.toEqual({
      errorCode: "not_configured",
      message:
        "Microsoft Graph / Teams Shifts schedule integration is not configured yet.",
      ok: false,
      status: {
        availability: "not_configured",
        message:
          "Microsoft Graph / Teams Shifts schedule integration is intentionally stubbed in Phase 6A and is not configured yet.",
        providerId: "microsoft-graph",
      },
    });
  });
});
