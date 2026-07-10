import type { AppConfig } from "../config.js";
import type { AppDataAccess } from "../data/types.js";
import { createMicrosoftEntraAuthProvider } from "./providers/microsoftEntraAuthProvider.js";
import { createPreviewAuthProvider } from "./providers/previewAuthProvider.js";
import type { AuthProvider } from "./types.js";

export function createAuthProvider(params: {
  config: AppConfig;
  dataAccess: AppDataAccess;
}): AuthProvider {
  if (params.config.authMode === "microsoft-entra") {
    return createMicrosoftEntraAuthProvider(params.config);
  }

  return createPreviewAuthProvider(params.dataAccess);
}
