import type { AppConfig } from "../config";
import type { AppDataAccess } from "../data/types";
import { createMicrosoftEntraAuthProvider } from "./providers/microsoftEntraAuthProvider";
import { createPreviewAuthProvider } from "./providers/previewAuthProvider";
import type { AuthProvider } from "./types";

export function createAuthProvider(params: {
  config: AppConfig;
  dataAccess: AppDataAccess;
}): AuthProvider {
  if (params.config.authMode === "microsoft-entra") {
    return createMicrosoftEntraAuthProvider(params.config);
  }

  return createPreviewAuthProvider(params.dataAccess);
}
