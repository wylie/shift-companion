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

    await expect(provider.getProviderStatus()).resolves.toMatchObject({
      availability: "available",
      enabled: true,
      message:
        "Using the persisted Neon/demo schedule provider backed by the current repository layer.",
      name: "NeonScheduleProvider",
      providerId: "neon-demo",
    });
  });
});

describe("createMicrosoftGraphScheduleProvider", () => {
  it("returns a safe not-configured result without making external calls", async () => {
    const provider = createMicrosoftGraphScheduleProvider(
      buildAppConfig({
        PORT: "8787",
      }),
    );

    await expect(provider.getProviderStatus()).resolves.toMatchObject({
      availability: "disabled",
      enabled: false,
      message:
        "Microsoft Graph is disabled. Neon/demo schedule data remains the active source until future Teams Shifts setup is enabled.",
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
    });

    await expect(
      provider.getCurrentUserScheduleRange({
        endDate: new Date("2026-06-29T00:00:00"),
        startDate: new Date("2026-06-22T00:00:00"),
        userId: "user-staff-1",
      }),
    ).resolves.toMatchObject({
      errorCode: "disabled",
      message:
        "Microsoft Graph is disabled. Neon/demo schedule data remains the active source until future Teams Shifts setup is enabled.",
      ok: false,
      status: {
        availability: "disabled",
        enabled: false,
        message:
          "Microsoft Graph is disabled. Neon/demo schedule data remains the active source until future Teams Shifts setup is enabled.",
        name: "MicrosoftGraphScheduleProvider",
        providerId: "microsoft-graph",
      },
    });
  });

  it("returns a safe setup-needed state when Microsoft Graph is enabled without full config", async () => {
    const provider = createMicrosoftGraphScheduleProvider(
      buildAppConfig({
        MICROSOFT_GRAPH_ENABLED: "true",
        PORT: "8787",
      }),
    );

    await expect(provider.getProviderStatus()).resolves.toMatchObject({
      availability: "not_configured",
      enabled: true,
      message:
        "Microsoft Graph is enabled, but setup is incomplete. Add MICROSOFT_CLIENT_ID and MICROSOFT_TENANT_ID before enabling real Teams Shifts reads later.",
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
    });
  });
});
