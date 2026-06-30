import type { AppConfig } from "../config";
import type {
  MicrosoftIntegrationReadiness,
  MicrosoftReadinessCheck,
  MicrosoftReadinessState,
} from "../../src/types";

function buildReadinessCheck(params: {
  disabledMessage: string;
  enabled: boolean;
  missingConfigMessage: string;
  readyToTestMessage: string;
  requiredEnvVars: string[];
  values: Record<string, string | undefined>;
}): MicrosoftReadinessCheck {
  if (!params.enabled) {
    return {
      enabled: false,
      message: params.disabledMessage,
      missingEnvVars: [],
      requiredEnvVars: params.requiredEnvVars,
      state: "disabled",
    };
  }

  const missingEnvVars = params.requiredEnvVars.filter(
    (envVar) => !params.values[envVar],
  );

  if (missingEnvVars.length > 0) {
    return {
      enabled: true,
      message: `${params.missingConfigMessage} Missing: ${missingEnvVars.join(", ")}.`,
      missingEnvVars,
      requiredEnvVars: params.requiredEnvVars,
      state: "missing_config",
    };
  }

  return {
    enabled: true,
    message: params.readyToTestMessage,
    missingEnvVars: [],
    requiredEnvVars: params.requiredEnvVars,
    state: "ready_to_test",
  };
}

function deriveOverallReadinessState(
  checks: MicrosoftReadinessCheck[],
): MicrosoftReadinessState {
  if (checks.some((check) => check.state === "missing_config")) {
    return "missing_config";
  }

  if (checks.some((check) => check.state === "ready_to_test")) {
    return "ready_to_test";
  }

  return "disabled";
}

export function evaluateMicrosoftIntegrationReadiness(
  config: AppConfig,
): MicrosoftIntegrationReadiness {
  const auth = buildReadinessCheck({
    disabledMessage:
      "Microsoft auth is disabled. Preview/demo mode remains the active path until future Entra sign-in work is ready to test.",
    enabled: config.microsoftAuthEnabled,
    missingConfigMessage:
      "Microsoft auth is enabled, but setup is incomplete.",
    readyToTestMessage:
      "Microsoft auth configuration placeholders are present. This environment is ready to test the future sign-in path once real Entra auth work is implemented.",
    requiredEnvVars: [
      "MICROSOFT_CLIENT_ID",
      "MICROSOFT_TENANT_ID",
      "MICROSOFT_REDIRECT_URI",
    ],
    values: {
      MICROSOFT_CLIENT_ID: config.microsoftClientId,
      MICROSOFT_REDIRECT_URI: config.microsoftRedirectUri,
      MICROSOFT_TENANT_ID: config.microsoftTenantId,
    },
  });

  const graph = buildReadinessCheck({
    disabledMessage:
      "Microsoft Graph is disabled. Neon/demo schedule data remains active until the future Teams Shifts provider is ready to test.",
    enabled: config.microsoftGraphEnabled,
    missingConfigMessage:
      "Microsoft Graph is enabled, but setup is incomplete.",
    readyToTestMessage:
      "Microsoft Graph configuration placeholders are present. This environment is ready to test the future Teams Shifts read path once real Graph work is implemented.",
    requiredEnvVars: ["MICROSOFT_CLIENT_ID", "MICROSOFT_TENANT_ID"],
    values: {
      MICROSOFT_CLIENT_ID: config.microsoftClientId,
      MICROSOFT_TENANT_ID: config.microsoftTenantId,
    },
  });

  return {
    auth,
    graph,
    overall: deriveOverallReadinessState([auth, graph]),
  };
}
