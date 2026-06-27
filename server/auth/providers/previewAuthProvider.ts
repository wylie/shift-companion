import { HttpError } from "../../http/errors";
import type { AppDataAccess } from "../../data/types";
import type { AuthProvider } from "../types";

export function createPreviewAuthProvider(
  dataAccess: AppDataAccess,
): AuthProvider {
  return {
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
        providerId: "preview-demo",
        status: "authenticated",
      };
    },
  };
}
