import type { AuthProviderId } from "./auth.js";

export type ScheduleProviderId = "microsoft-graph" | "neon-demo";

export type ProviderAvailability =
  | "available"
  | "disabled"
  | "not_configured"
  | "not_implemented";

export type ProviderCapability =
  | "backgroundSync"
  | "calendarExport"
  | "configured"
  | "emailFeedback"
  | "microsoft"
  | "preview"
  | "readSchedule"
  | "writeSchedule";

export type ProviderStatus = {
  availability: ProviderAvailability;
  capabilities: ProviderCapability[];
  configured: boolean;
  enabled: boolean;
  message: string;
  name: string;
  providerId: AuthProviderId | ScheduleProviderId | "feedback-email";
  version?: string;
};
