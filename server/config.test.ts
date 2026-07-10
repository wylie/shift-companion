import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { buildAppConfig, validateAppConfig } from "./config";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

describe("validateAppConfig", () => {
  it("loads the package version in the server runtime", () => {
    const config = buildAppConfig({
      PORT: "8787",
    });

    expect(config.version).toBe(packageJson.version);
  });

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

  it("does not require Microsoft auth variables in local preview mode", () => {
    const config = buildAppConfig({
      MICROSOFT_AUTH_ENABLED: "false",
      MICROSOFT_GRAPH_ENABLED: "false",
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(validation.errors).toEqual([]);
    expect(validation.warnings).not.toContain(
      expect.stringContaining("Microsoft auth is enabled but incomplete."),
    );
    expect(validation.warnings).not.toContain(
      expect.stringContaining("Microsoft Graph is enabled but incomplete."),
    );
  });

  it("warns when Microsoft auth is enabled without the future setup values", () => {
    const config = buildAppConfig({
      MICROSOFT_AUTH_ENABLED: "true",
      PORT: "8787",
    });
    const validation = validateAppConfig(config);

    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toContain(
      "Microsoft auth is enabled but incomplete. Missing: MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI.",
    );
  });
});
