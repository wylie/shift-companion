import type { AppConfig } from "../../config";
import { isTeamsSsoConfigured } from "../../config";
import type { AuthProvider } from "../types";

export function createMicrosoftEntraAuthProvider(
  config: AppConfig,
): AuthProvider {
  return {
    async getSession() {
      if (!isTeamsSsoConfigured(config)) {
        return {
          isConfigured: false,
          message:
            'AUTH_MODE is set to "microsoft-entra", but Microsoft Entra setup is not configured yet. Switch back to preview/demo mode or add the future Entra settings before enabling this path.',
          mode: "microsoft-entra-not-configured" as const,
          providerId: "microsoft-entra" as const,
          status: "setup-required" as const,
        };
      }

      return {
        isConfigured: true,
        message:
          "Microsoft Entra sign-in is reserved for a future phase. Token verification, redirect handling, and app-user mapping will be connected here later without changing the existing UI contracts.",
        mode: "microsoft-entra-future" as const,
        providerId: "microsoft-entra" as const,
        status: "setup-required" as const,
      };
    },
  };
}
