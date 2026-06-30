import type { AppConfig } from "../../config";
import { evaluateMicrosoftIntegrationReadiness } from "../microsoftReadiness";
import type {
  IntegrationProviderStatus,
  ScheduleProvider,
} from "../types";
import { readOnlyScheduleCapabilities } from "../types";

export function getMicrosoftGraphScheduleProviderStatus(
  config: AppConfig,
): IntegrationProviderStatus {
  const readiness = evaluateMicrosoftIntegrationReadiness(config).graph;

  if (readiness.state === "disabled") {
    return {
      availability: "disabled",
      capabilities: [...readOnlyScheduleCapabilities, "configured"],
      configured: false,
      enabled: false,
      message: readiness.message,
      name: "MicrosoftGraphScheduleProvider",
      providerId: "microsoft-graph",
      version: "0.2.0",
    };
  }

  if (readiness.state === "missing_config") {
    return {
      availability: "not_configured",
      capabilities: [...readOnlyScheduleCapabilities, "configured"],
      configured: false,
      enabled: true,
      message: readiness.message,
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
    message: readiness.message,
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
