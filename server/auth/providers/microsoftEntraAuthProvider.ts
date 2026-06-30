import type { AppConfig } from "../../config";
import { isMicrosoftAuthConfigured } from "../../config";
import type { AuthProvider, AuthProviderStatus } from "../types";

export function getMicrosoftEntraProviderStatus(
  config: AppConfig,
): AuthProviderStatus {
  if (!config.microsoftAuthEnabled) {
    return {
      availability: "not_configured",
      capabilities: ["configured", "microsoft"] as const,
      configured: false,
      enabled: false,
      message:
        "Microsoft auth is disabled. Preview/demo auth remains the active MVP path until MICROSOFT_AUTH_ENABLED=true and future setup is completed.",
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
      version: "0.2.0",
    };
  }

  if (!isMicrosoftAuthConfigured(config)) {
    return {
      availability: "not_configured",
      capabilities: ["configured", "microsoft"] as const,
      configured: false,
      enabled: true,
      message:
        "Microsoft auth is enabled, but setup is incomplete. Add MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, and MICROSOFT_REDIRECT_URI before enabling real sign-in later.",
      name: "MicrosoftEntraAuthProvider",
      providerId: "microsoft-entra",
      version: "0.2.0",
    };
  }

  return {
    availability: "not_implemented",
    capabilities: ["configured", "microsoft"] as const,
    configured: true,
    enabled: true,
    message:
      "Microsoft Entra auth groundwork is configured, but real sign-in remains intentionally stubbed for v0.2.0.",
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
