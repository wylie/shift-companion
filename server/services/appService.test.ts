import { describe, expect, it } from "vitest";
import { buildCalendarIcs } from "../../src/lib/calendar";
import type { Shift } from "../../src/types";
import { createMockDataAccess } from "../data/mockDataAccess";
import type { AuthProvider } from "../auth/types";
import type { IntegrationRegistry } from "../integrations/registry";
import type { ScheduleProvider } from "../integrations/types";
import { AppService } from "./appService";

function createScheduleProviderStub(shifts: Shift[]): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange() {
      return {
        data: shifts,
        ok: true,
        status: {
          availability: "available",
          capabilities: ["calendarExport", "readSchedule"],
          configured: true,
          enabled: true,
          message: "stub",
          name: "NeonScheduleProvider",
          providerId: "neon-demo",
        },
      };
    },
    async getCurrentUserShiftById({ shiftId }) {
      return {
        data: shifts.find((shift) => shift.id === shiftId),
        ok: true,
        status: {
          availability: "available",
          capabilities: ["calendarExport", "readSchedule"],
          configured: true,
          enabled: true,
          message: "stub",
          name: "NeonScheduleProvider",
          providerId: "neon-demo",
        },
      };
    },
    async getProviderStatus() {
      return {
        availability: "available",
        capabilities: ["calendarExport", "readSchedule"],
        configured: true,
        enabled: true,
        message: "stub",
        name: "NeonScheduleProvider",
        providerId: "neon-demo",
      };
    },
  };
}

function createAuthProviderStub(): AuthProvider {
  return {
    async getProviderStatus() {
      return {
        availability: "not_configured",
        capabilities: ["configured", "microsoft"],
        configured: false,
        enabled: false,
        message: "Microsoft Entra auth is not configured yet.",
        name: "MicrosoftEntraAuthProvider",
        providerId: "microsoft-entra",
      };
    },
    async getSession() {
      return {
        isConfigured: false,
        message: "Microsoft Entra auth is not configured yet.",
        mode: "microsoft-entra-not-configured",
        providerId: "microsoft-entra",
        status: "setup-required",
      };
    },
  };
}

function createIntegrationRegistryStub(params: {
  authProvider?: AuthProvider;
  scheduleProvider?: ScheduleProvider;
}): IntegrationRegistry {
  const authProvider = params.authProvider ?? createAuthProviderStub();
  const scheduleProvider =
    params.scheduleProvider ?? createScheduleProviderStub([]);

  return {
    getAuthProvider() {
      return authProvider;
    },
    getCalendarExportProvider() {
      return scheduleProvider;
    },
    getFeedbackProvider() {
      return {
        getFeedbackEmail() {
          return undefined;
        },
        async getProviderStatus() {
          return {
            availability: "not_configured",
            capabilities: ["emailFeedback"],
            configured: false,
            enabled: false,
            message: "Feedback email is not configured.",
            name: "EmailFeedbackProvider",
            providerId: "feedback-email",
          };
        },
      };
    },
    async getProviderDiagnostics() {
      return {
        auth: await authProvider.getProviderStatus(),
        calendarExport: await scheduleProvider.getProviderStatus(),
        feedback: await this.getFeedbackProvider().getProviderStatus(),
        schedule: await scheduleProvider.getProviderStatus(),
      };
    },
    getScheduleProvider() {
      return scheduleProvider;
    },
  };
}

describe("AppService calendar export", () => {
  it("returns only the current preview user's shifts for calendar export", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(shifts.length).toBeGreaterThan(0);
    expect(shifts.every((shift) => shift.userId === "user-staff-1")).toBe(true);
    expect(shifts.some((shift) => shift.userId === "user-staff-2")).toBe(false);
  });

  it("builds ICS content without another user's shift details", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );
    const ics = buildCalendarIcs(shifts, {
      generatedAt: new Date("2026-06-24T12:00:00Z"),
      productId: "-//Test//EN",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Wellness Attendant");
    expect(ics).not.toContain("Membership Support");
    expect(ics).not.toContain("Taylor Gomez");
  });

  it("limits calendar export to the selected displayed window", async () => {
    const service = new AppService(createMockDataAccess());
    const currentUser = await service.getPreviewUser("user-staff-1");
    const shifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(shifts.every((shift) => shift.start < "2026-06-29T00:00:00")).toBe(
      true,
    );
  });

  it("uses the schedule provider boundary for schedule and calendar lookups", async () => {
    const dataAccess = createMockDataAccess();
    const currentUser = await new AppService(dataAccess).getPreviewUser(
      "user-staff-1",
    );
    const providerShifts: Shift[] = [
      {
        id: "shift-provider-1",
        userId: currentUser.id,
        title: "Provider Shift",
        start: "2026-06-23T14:00:00.000Z",
        end: "2026-06-23T18:00:00.000Z",
        location: "Wellness Floor",
      },
    ];
    const service = new AppService(dataAccess, {
      integrationRegistry: createIntegrationRegistryStub({
        authProvider: {
          ...createAuthProviderStub(),
          async getProviderStatus() {
            return {
              availability: "available",
              capabilities: ["configured", "preview"],
              configured: true,
              enabled: true,
              message: "stub auth",
              name: "PreviewAuthProvider",
              providerId: "preview-demo",
            };
          },
          async getSession() {
            const currentUser = await dataAccess.users.getById("user-staff-1");

            if (!currentUser) {
              throw new Error("Missing user for stub auth provider.");
            }

            return {
              currentUser,
              isConfigured: true,
              mode: "preview-demo",
              providerId: "preview-demo",
              status: "authenticated",
            };
          },
        },
        scheduleProvider: createScheduleProviderStub(providerShifts),
      }),
    });

    const visibleShifts = await service.listOwnShifts(currentUser);
    const exportableShifts = await service.getOwnCalendarShifts(
      currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(visibleShifts).toEqual(providerShifts);
    expect(exportableShifts).toEqual(providerShifts);
  });

  it("keeps protected actions scoped to the resolved app user", async () => {
    const service = new AppService(createMockDataAccess());
    const authenticatedUser = await service.requireCurrentUser({
      appRuntime: "browserPreview",
      previewUserId: "user-staff-1",
    });
    const shifts = await service.getOwnCalendarShifts(
      authenticatedUser.currentUser,
      new Date("2026-06-22T00:00:00"),
      1,
    );

    expect(authenticatedUser.currentUser.id).toBe("user-staff-1");
    expect(shifts.every((shift) => shift.userId === authenticatedUser.currentUser.id)).toBe(
      true,
    );
  });

  it("returns a safe setup-needed bootstrap state for the Entra auth stub", async () => {
    const service = new AppService(createMockDataAccess(), {
      integrationRegistry: createIntegrationRegistryStub({
        authProvider: createAuthProviderStub(),
      }),
    });
    const bootstrap = await service.getBootstrap({
      appRuntime: "teams",
    });

    expect(bootstrap.auth.mode).toBe("microsoft-entra-not-configured");
    expect(bootstrap.auth.status).toBe("setup-required");
    expect(bootstrap.currentUser).toBeNull();
    expect(bootstrap.previewUsers).toEqual([]);
    expect(bootstrap.providerStatus.currentAuth).toMatchObject({
      availability: "not_configured",
      enabled: false,
      message: "Microsoft Entra auth is not configured yet.",
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
    });
    expect(bootstrap.microsoftReadiness.auth.state).toBe("disabled");
  });

  it("includes default provider status for the preview/demo MVP path", async () => {
    const service = new AppService(createMockDataAccess());
    const bootstrap = await service.getBootstrap({
      appRuntime: "browserPreview",
      previewUserId: "user-staff-1",
    });

    expect(bootstrap.providerStatus.currentAuth).toMatchObject({
      availability: "available",
      enabled: true,
      message:
        "Preview/demo auth is active and resolves the selected local demo identity.",
      name: "PreviewAuthProvider",
      providerId: "preview-demo",
    });
    expect(bootstrap.providerStatus.currentSchedule).toMatchObject({
      availability: "available",
      enabled: true,
      message:
        "Using the persisted Neon/demo schedule provider backed by the current repository layer.",
      name: "NeonScheduleProvider",
      providerId: "neon-demo",
    });
    expect(bootstrap.providerStatus.calendarExport).toMatchObject({
      availability: "available",
      enabled: true,
      name: "NeonScheduleProvider",
      providerId: "neon-demo",
    });
    expect(bootstrap.providerStatus.database).toEqual(
      bootstrap.dataSource === "postgres"
        ? {
            connected: true,
            migrationVersion: undefined,
            name: "Postgres / Neon",
            status: "connected",
          }
        : {
            connected: false,
            migrationVersion: undefined,
            name: "In-memory demo data",
            status: "demo",
          },
    );
    expect(bootstrap.providerStatus.feedback).toMatchObject({
      availability: "not_configured",
      enabled: false,
      name: "EmailFeedbackProvider",
      providerId: "feedback-email",
    });
    expect(bootstrap.providerStatus.microsoftAuth).toMatchObject({
      availability: "not_configured",
      enabled: false,
      message:
        "Microsoft auth is disabled. Preview/demo mode remains the active path until future Entra sign-in work is ready to test.",
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
    });
    expect(bootstrap.providerStatus.microsoftGraph).toMatchObject({
      availability: "disabled",
      enabled: false,
      message:
        "Microsoft Graph is disabled. Neon/demo schedule data remains active until the future Teams Shifts provider is ready to test.",
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
    });
    expect(bootstrap.microsoftReadiness.auth.state).toBe("disabled");
    expect(bootstrap.microsoftReadiness.graph.state).toBe("disabled");
    expect(bootstrap.microsoftReadiness.overall).toBe("disabled");
  });

  it("keeps Microsoft secret fields out of the bootstrap diagnostics payload", async () => {
    const service = new AppService(createMockDataAccess());
    const bootstrap = await service.getBootstrap({
      appRuntime: "browserPreview",
      previewUserId: "user-staff-1",
    });
    const serialized = JSON.stringify(bootstrap);

    expect(serialized).not.toContain("MICROSOFT_CLIENT_SECRET");
    expect(serialized).not.toContain("microsoftClientSecret");

    if (process.env.MICROSOFT_CLIENT_SECRET) {
      expect(serialized).not.toContain(process.env.MICROSOFT_CLIENT_SECRET);
    }
  });
});

describe("AppService manager review logging", () => {
  it("deduplicates repeated manager review audit events for the same week", async () => {
    const service = new AppService(createMockDataAccess());
    const manager = await service.getPreviewUser("user-manager-1");
    const firstEvent = await service.recordManagerReview(
      manager,
      "wellness",
      new Date("2026-06-22T00:00:00"),
    );
    const secondEvent = await service.recordManagerReview(
      manager,
      "wellness",
      new Date("2026-06-22T00:00:00"),
    );

    expect(secondEvent.id).toBe(firstEvent.id);
  });
});
