import { describe, expect, it } from "vitest";
import { buildAppConfig, validateAppConfig } from "./config";

describe("validateAppConfig", () => {
  it("warns about incomplete Microsoft Entra configuration without failing startup", () => {
    const config = buildAppConfig({
      ENTRA_CLIENT_ID: "client-id-only",
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toContain(
      "Microsoft Entra configuration is incomplete. Missing: ENTRA_APP_ID_URI, ENTRA_TENANT_ID.",
    );
  });

  it("warns when the app is running without database or feedback email configuration", () => {
    const config = buildAppConfig({
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toContain(
      "DATABASE_URL is not configured. The API will use in-memory demo data only.",
    );
    expect(validation.warnings).toContain(
      "FEEDBACK_EMAIL is not configured. Settings feedback actions will be unavailable.",
    );
  });

  it("falls back to the Neon/demo schedule provider for unsupported values", () => {
    const config = buildAppConfig({
      PORT: "8787",
      SCHEDULE_PROVIDER: "future-provider",
    });
    const validation = validateAppConfig(config);

    expect(config.scheduleProvider).toBe("neon-demo");
    expect(validation.warnings).toContain(
      'SCHEDULE_PROVIDER "future-provider" is not supported. Falling back to "neon-demo".',
    );
  });

  it("defaults auth mode to preview-demo and warns on unsupported values", () => {
    const config = buildAppConfig({
      AUTH_MODE: "future-auth",
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(config.authMode).toBe("preview-demo");
    expect(validation.warnings).toContain(
      'AUTH_MODE "future-auth" is not supported. Falling back to "preview-demo".',
    );
  });
});
