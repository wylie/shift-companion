import type { AppConfig } from "../../config";
import type {
  IntegrationProviderStatus,
  ScheduleProvider,
} from "../types";
import { readOnlyScheduleCapabilities } from "../types";

export function getMicrosoftGraphScheduleProviderStatus(
  config: AppConfig,
): IntegrationProviderStatus {
  if (!config.microsoftGraphEnabled) {
    return {
      availability: "disabled",
      capabilities: [...readOnlyScheduleCapabilities, "configured"],
      configured: false,
      enabled: false,
      message:
        "Microsoft Graph is disabled. Neon/demo schedule data remains the active source until future Teams Shifts setup is enabled.",
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
      version: "0.2.0",
    };
  }

  if (!config.microsoftClientId || !config.microsoftTenantId) {
    return {
      availability: "not_configured",
      capabilities: [...readOnlyScheduleCapabilities, "configured"],
      configured: false,
      enabled: true,
      message:
        "Microsoft Graph is enabled, but setup is incomplete. Add MICROSOFT_CLIENT_ID and MICROSOFT_TENANT_ID before enabling real Teams Shifts reads later.",
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
      version: "0.2.0",
    };
  }

  return {
    availability: "not_implemented",
    capabilities: [...readOnlyScheduleCapabilities, "configured"],
    configured: true,
    enabled: true,
    message:
      "Microsoft Graph / Teams Shifts schedule integration is configured for future work, but it remains intentionally stubbed for v0.2.0.",
    name: "MicrosoftGraphScheduleProvider",
    providerId: "microsoft-graph",
    version: "0.2.0",
  };
}

export function createMicrosoftGraphScheduleProvider(
  config: AppConfig,
): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange() {
      const status = getMicrosoftGraphScheduleProviderStatus(config);
      return {
        errorCode:
          status.availability === "disabled"
            ? ("disabled" as const)
            : status.availability === "not_implemented"
              ? ("not_implemented" as const)
              : ("not_configured" as const),
        message: status.message,
        ok: false,
        status,
      };
    },
    async getCurrentUserShiftById() {
      const status = getMicrosoftGraphScheduleProviderStatus(config);
      return {
        errorCode:
          status.availability === "disabled"
            ? ("disabled" as const)
            : status.availability === "not_implemented"
              ? ("not_implemented" as const)
              : ("not_configured" as const),
        message: status.message,
        ok: false,
        status,
      };
    },
    async getProviderStatus() {
      // Future Graph and Teams Shifts lookups will live behind this provider.
      // This v0.2.0 stub exists only to hold the contract and selection path.
      return getMicrosoftGraphScheduleProviderStatus(config);
    },
  };
}
