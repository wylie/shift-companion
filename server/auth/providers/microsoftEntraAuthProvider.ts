import type { AppConfig } from "../../config";
import { evaluateMicrosoftIntegrationReadiness } from "../../integrations/microsoftReadiness";
import type { AuthProvider, AuthProviderStatus } from "../types";

export function getMicrosoftEntraProviderStatus(
  config: AppConfig,
): AuthProviderStatus {
  const readiness = evaluateMicrosoftIntegrationReadiness(config).auth;

  if (readiness.state === "disabled") {
    return {
      availability: "not_configured",
      capabilities: ["configured", "microsoft"],
      configured: false,
      enabled: false,
      message: readiness.message,
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
      version: "0.2.0",
    };
  }

  if (readiness.state === "missing_config") {
    return {
      availability: "not_configured",
      capabilities: ["configured", "microsoft"],
      configured: false,
      enabled: true,
      message: readiness.message,
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
      version: "0.2.0",
    };
  }

  return {
    availability: "not_implemented",
    capabilities: ["configured", "microsoft"],
    configured: true,
    enabled: true,
    message: readiness.message,
    name: "MicrosoftEntraAuthProvider",
    providerId: "microsoft-entra",
    version: "0.2.0",
  };
}

export function createMicrosoftEntraAuthProvider(
  config: AppConfig,
): AuthProvider {
  return {
    async getProviderStatus() {
      return getMicrosoftEntraProviderStatus(config);
    },
    async getSession() {
      const providerStatus = getMicrosoftEntraProviderStatus(config);

      if (providerStatus.availability === "not_configured") {
        return {
          isConfigured: false,
          message: providerStatus.message,
          mode: "microsoft-entra-not-configured" as const,
          providerId: providerStatus.providerId,
          status: "setup-required" as const,
        };
      }

      return {
        isConfigured: true,
        message: providerStatus.message,
        mode: "microsoft-entra-future" as const,
        providerId: providerStatus.providerId,
        status: "setup-required" as const,
      };
    },
  };
}
