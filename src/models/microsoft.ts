export type MicrosoftReadinessState =
  | "disabled"
  | "missing_config"
  | "ready_to_test";

export type MicrosoftReadinessCheck = {
  enabled: boolean;
  message: string;
  missingEnvVars: string[];
  requiredEnvVars: string[];
  state: MicrosoftReadinessState;
};

export type MicrosoftIntegrationReadiness = {
  auth: MicrosoftReadinessCheck;
  graph: MicrosoftReadinessCheck;
  overall: MicrosoftReadinessState;
};

export type MicrosoftSetupChecklistItem = {
  description: string;
  id: string;
  title: string;
};

export const microsoftSetupChecklist: MicrosoftSetupChecklistItem[] = [
  {
    id: "tenant",
    title: "Create a Microsoft test tenant",
    description:
      "Create a Microsoft Entra tenant or a Microsoft 365 test tenant for non-production verification work.",
  },
  {
    id: "app-registration",
    title: "Register the app in Microsoft Entra",
    description:
      "Create the future app registration that will back sign-in and Graph access for this companion.",
  },
  {
    id: "redirect-uri",
    title: "Configure the redirect URI",
    description:
      "Add the future callback URL that matches the environment where sign-in will eventually be tested.",
  },
  {
    id: "env-vars",
    title: "Add Microsoft environment variables",
    description:
      "Set MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, and MICROSOFT_REDIRECT_URI. Keep MICROSOFT_CLIENT_SECRET server-only if it is needed later.",
  },
  {
    id: "permissions",
    title: "Configure required API permissions",
    description:
      "Request the minimum Microsoft Graph permissions needed for the final sign-in and Teams Shifts read path.",
  },
  {
    id: "manifest",
    title: "Update the Teams app manifest if needed",
    description:
      "Align the Teams app manifest and related identifiers once Microsoft sign-in is part of the real runtime flow.",
  },
  {
    id: "sign-in",
    title: "Verify sign-in",
    description:
      "Confirm that the future Entra sign-in flow resolves a real app user correctly before enabling it broadly.",
  },
  {
    id: "graph-access",
    title: "Verify Graph access",
    description:
      "Confirm that the future Graph integration can read published shifts with the expected tenant and permissions.",
  },
  {
    id: "auth-flag",
    title: "Enable the Microsoft auth flag",
    description:
      "Set MICROSOFT_AUTH_ENABLED=true only after the future sign-in path is ready for controlled testing.",
  },
  {
    id: "graph-flag",
    title: "Enable the Graph provider flag",
    description:
      "Set MICROSOFT_GRAPH_ENABLED=true only after the future schedule provider is ready for controlled testing.",
  },
];
