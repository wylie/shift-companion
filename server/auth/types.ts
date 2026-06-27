import type {
  AppAuthSession,
  AppRuntimeMode,
  CurrentUser,
  ProviderStatus,
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

export type AuthProviderStatus = ProviderStatus & {
  providerId: AppAuthSession["providerId"];
};

export type AuthProvider = {
  getSession(requestContext: AuthRequestContext): Promise<AuthSession>;
  getProviderStatus(): Promise<AuthProviderStatus>;
};

export function isAuthenticatedSession(
  session: AuthSession,
): session is AuthSession & { currentUser: CurrentUser; status: "authenticated" } {
  return session.status === "authenticated" && Boolean(session.currentUser);
}
