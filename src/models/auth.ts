export type AuthMode =
  | "preview-demo"
  | "microsoft-entra-not-configured"
  | "microsoft-entra-future";

export type AuthProviderId = "microsoft-entra" | "preview-demo";

export type AuthStatus = "authenticated" | "setup-required" | "unmapped";

export type AppAuthSession = {
  isConfigured: boolean;
  message?: string;
  mode: AuthMode;
  providerId: AuthProviderId;
  status: AuthStatus;
};
