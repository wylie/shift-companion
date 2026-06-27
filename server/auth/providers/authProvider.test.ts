import { describe, expect, it } from "vitest";
import { buildAppConfig } from "../../config";
import { createMockDataAccess } from "../../data/mockDataAccess";
import { createAuthProvider } from "../index";
import { createMicrosoftEntraAuthProvider } from "./microsoftEntraAuthProvider";
import { createPreviewAuthProvider } from "./previewAuthProvider";

describe("PreviewAuthProvider", () => {
  it("resolves the selected demo user", async () => {
    const provider = createPreviewAuthProvider(createMockDataAccess());
    const session = await provider.getSession({
      appRuntime: "browserPreview",
      previewUserId: "user-manager-1",
    });

    expect(session.status).toBe("authenticated");
    expect(session.mode).toBe("preview-demo");
    expect(session.currentUser?.id).toBe("user-manager-1");
  });
});

describe("MicrosoftEntraAuthProvider", () => {
  it("returns a safe not-configured state when Entra settings are absent", async () => {
    const provider = createMicrosoftEntraAuthProvider(
      buildAppConfig({
        AUTH_MODE: "microsoft-entra",
        PORT: "8787",
      }),
    );
    const session = await provider.getSession({
      appRuntime: "teams",
    });

    expect(session.status).toBe("setup-required");
    expect(session.mode).toBe("microsoft-entra-not-configured");
    expect(session.isConfigured).toBe(false);
    expect(session.currentUser).toBeUndefined();
  });

  it("returns a safe future state when Entra settings exist but auth is still stubbed", async () => {
    const provider = createMicrosoftEntraAuthProvider(
      buildAppConfig({
        AUTH_MODE: "microsoft-entra",
        ENTRA_APP_ID_URI: "api://client-id-123",
        ENTRA_CLIENT_ID: "client-id-123",
        ENTRA_TENANT_ID: "11111111-2222-3333-4444-555555555555",
        PORT: "8787",
      }),
    );
    const session = await provider.getSession({
      appRuntime: "teams",
    });

    expect(session.status).toBe("setup-required");
    expect(session.mode).toBe("microsoft-entra-future");
    expect(session.isConfigured).toBe(true);
    expect(session.currentUser).toBeUndefined();
  });
});

describe("createAuthProvider", () => {
  it("defaults to preview-demo mode", async () => {
    const provider = createAuthProvider({
      config: buildAppConfig({
        PORT: "8787",
      }),
      dataAccess: createMockDataAccess(),
    });
    const session = await provider.getSession({
      appRuntime: "browserPreview",
    });

    expect(session.providerId).toBe("preview-demo");
    expect(session.status).toBe("authenticated");
    expect(session.currentUser?.id).toBe("user-staff-1");
  });
});
