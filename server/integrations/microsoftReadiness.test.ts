import { describe, expect, it } from "vitest";
import { buildAppConfig } from "../config";
import { evaluateMicrosoftIntegrationReadiness } from "./microsoftReadiness";

describe("evaluateMicrosoftIntegrationReadiness", () => {
  it("returns disabled when Microsoft flags are false or missing", () => {
    const readiness = evaluateMicrosoftIntegrationReadiness(
      buildAppConfig({
        PORT: "8787",
      }),
    );

    expect(readiness.auth).toEqual({
      enabled: false,
      message:
        "Microsoft auth is disabled. Preview/demo mode remains the active path until future Entra sign-in work is ready to test.",
      missingEnvVars: [],
      requiredEnvVars: [
        "MICROSOFT_CLIENT_ID",
        "MICROSOFT_TENANT_ID",
        "MICROSOFT_REDIRECT_URI",
      ],
      state: "disabled",
    });
    expect(readiness.graph).toEqual({
      enabled: false,
      message:
        "Microsoft Graph is disabled. Neon/demo schedule data remains active until the future Teams Shifts provider is ready to test.",
      missingEnvVars: [],
      requiredEnvVars: ["MICROSOFT_CLIENT_ID", "MICROSOFT_TENANT_ID"],
      state: "disabled",
    });
    expect(readiness.overall).toBe("disabled");
  });

  it("returns missing_config when a Microsoft path is enabled without required config", () => {
    const readiness = evaluateMicrosoftIntegrationReadiness(
      buildAppConfig({
        MICROSOFT_AUTH_ENABLED: "true",
        PORT: "8787",
      }),
    );

    expect(readiness.auth.state).toBe("missing_config");
    expect(readiness.auth.missingEnvVars).toEqual([
      "MICROSOFT_CLIENT_ID",
      "MICROSOFT_TENANT_ID",
      "MICROSOFT_REDIRECT_URI",
    ]);
    expect(readiness.overall).toBe("missing_config");
  });

  it("returns ready_to_test for complete fake Microsoft config", () => {
    const readiness = evaluateMicrosoftIntegrationReadiness(
      buildAppConfig({
        MICROSOFT_AUTH_ENABLED: "true",
        MICROSOFT_CLIENT_ID: "client-id-123",
        MICROSOFT_CLIENT_SECRET: "server-only-secret",
        MICROSOFT_GRAPH_ENABLED: "true",
        MICROSOFT_REDIRECT_URI: "https://example.com/auth/microsoft/callback",
        MICROSOFT_TENANT_ID: "11111111-2222-3333-4444-555555555555",
        PORT: "8787",
      }),
    );

    expect(readiness.auth.state).toBe("ready_to_test");
    expect(readiness.graph.state).toBe("ready_to_test");
    expect(readiness.overall).toBe("ready_to_test");
    expect(JSON.stringify(readiness)).not.toContain("server-only-secret");
    expect(JSON.stringify(readiness)).not.toContain("MICROSOFT_CLIENT_SECRET");
  });
});
