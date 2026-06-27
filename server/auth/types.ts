import type {
  AppAuthSession,
  AppRuntimeMode,
  CurrentUser,
} from "../../src/types";

export type AuthRequestContext = {
  appRuntime: AppRuntimeMode;
  bearerToken?: string;
  previewUserId?: string;
};

export type AuthenticatedUser = {
  auth: AppAuthSession;
  currentUser: CurrentUser;
};

export type AuthSession = AppAuthSession & {
  currentUser?: CurrentUser;
};

export type AuthProvider = {
  getSession(requestContext: AuthRequestContext): Promise<AuthSession>;
};

export function isAuthenticatedSession(
  session: AuthSession,
): session is AuthSession & { currentUser: CurrentUser; status: "authenticated" } {
  return session.status === "authenticated" && Boolean(session.currentUser);
}
