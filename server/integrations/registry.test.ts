import { describe, expect, it } from "vitest";
import { buildAppConfig } from "../config";
import { createMockDataAccess } from "../data/mockDataAccess";
import { createIntegrationRegistry } from "./registry";

describe("createIntegrationRegistry", () => {
  it("returns preview and Neon providers by default", async () => {
    const registry = createIntegrationRegistry({
      config: buildAppConfig({
        PORT: "8787",
      }),
      dataAccess: createMockDataAccess(),
    });

    await expect(registry.getAuthProvider().getProviderStatus()).resolves.toMatchObject({
      providerId: "preview-demo",
      name: "PreviewAuthProvider",
    });
    await expect(
      registry.getScheduleProvider().getProviderStatus(),
    ).resolves.toMatchObject({
      providerId: "neon-demo",
      name: "NeonScheduleProvider",
    });
  });

  it("reports safe disabled Microsoft providers when the flags are off", async () => {
    const registry = createIntegrationRegistry({
      config: buildAppConfig({
        PORT: "8787",
      }),
      dataAccess: createMockDataAccess(),
    });

    await expect(
      registry.getAuthProvider("microsoft-entra").getProviderStatus(),
    ).resolves.toMatchObject({
      availability: "not_configured",
      enabled: false,
      providerId: "microsoft-entra",
    });
    await expect(
      registry.getScheduleProvider("microsoft-graph").getProviderStatus(),
    ).resolves.toMatchObject({
      availability: "disabled",
      enabled: false,
      providerId: "microsoft-graph",
    });
  });

  it("exposes non-network provider diagnostics", async () => {
    const registry = createIntegrationRegistry({
      config: buildAppConfig({
        FEEDBACK_EMAIL: "feedback@example.org",
        PORT: "8787",
      }),
      dataAccess: createMockDataAccess(),
    });
    const diagnostics = await registry.getProviderDiagnostics();

    expect(diagnostics.auth).toMatchObject({
      providerId: "preview-demo",
    });
    expect(diagnostics.schedule).toMatchObject({
      providerId: "neon-demo",
    });
    expect(diagnostics.calendarExport).toMatchObject({
      providerId: "neon-demo",
    });
    expect(diagnostics.feedback).toMatchObject({
      providerId: "feedback-email",
      configured: true,
    });
  });
});
