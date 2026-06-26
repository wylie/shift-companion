import type {
  IntegrationProviderStatus,
  ScheduleProvider,
} from "../types";

const status: IntegrationProviderStatus = {
  availability: "not_configured",
  message:
    "Microsoft Graph / Teams Shifts schedule integration is intentionally stubbed in Phase 6A and is not configured yet.",
  providerId: "microsoft-graph",
};

export function createMicrosoftGraphScheduleProvider(): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange() {
      return {
        errorCode: "not_configured" as const,
        message:
          "Microsoft Graph / Teams Shifts schedule integration is not configured yet.",
        ok: false,
        status,
      };
    },
    async getCurrentUserShiftById() {
      return {
        errorCode: "not_configured" as const,
        message:
          "Microsoft Graph / Teams Shifts schedule integration is not configured yet.",
        ok: false,
        status,
      };
    },
    async getProviderStatus() {
      // Future Graph and Teams Shifts lookups will live behind this provider.
      // This Phase 6A stub exists only to hold the contract and selection path.
      return status;
    },
  };
}
