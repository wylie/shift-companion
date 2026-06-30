import { HttpError } from "../../http/errors";
import type { AppDataAccess } from "../../data/types";
import type { AuthProvider, AuthProviderStatus } from "../types";

const status: AuthProviderStatus = {
  availability: "available",
  capabilities: ["configured", "preview"],
  configured: true,
  enabled: true,
  message:
    "Preview/demo auth is active and resolves the selected local demo identity.",
  name: "PreviewAuthProvider",
  providerId: "preview-demo",
  version: "0.2.0",
};

export function createPreviewAuthProvider(
  dataAccess: AppDataAccess,
): AuthProvider {
  return {
    async getProviderStatus() {
      return status;
    },
    async getSession(requestContext) {
      const previewUsers = await dataAccess.users.listPreviewUsers();
      const requestedUserId = requestContext.previewUserId ?? previewUsers[0]?.id;

      if (!requestedUserId) {
        throw new HttpError(500, "No preview users are configured.");
      }

      const currentUser = await dataAccess.users.getById(requestedUserId);

      if (!currentUser) {
        throw new HttpError(404, "Preview identity not found.");
      }

      return {
        currentUser,
        isConfigured: true,
        mode: "preview-demo",
        providerId: status.providerId,
        status: "authenticated",
      };
    },
  };
}
