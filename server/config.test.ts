import { describe, expect, it } from "vitest";
import { buildAppConfig, validateAppConfig } from "./config";

describe("validateAppConfig", () => {
  it("reports incomplete Teams SSO configuration", () => {
    const config = buildAppConfig({
      ENTRA_CLIENT_ID: "client-id-only",
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(validation.errors).toContain(
      "Teams SSO server configuration is incomplete. Missing: ENTRA_APP_ID_URI, ENTRA_TENANT_ID.",
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
});
