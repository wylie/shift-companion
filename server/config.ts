import "dotenv/config";
import packageJson from "../package.json";
import type { AuthProviderId } from "../src/types";
import type { ScheduleProviderId } from "./integrations/types";

export type AppConfig = {
  appBaseUrl?: string;
  authMode: AuthProviderId;
  authModeSelection?: string;
  documentationUrl?: string;
  databaseUrl?: string;
  entraAppIdUri?: string;
  entraClientId?: string;
  entraTenantId?: string;
  feedbackEmail?: string;
  microsoftAuthEnabled: boolean;
  microsoftAuthEnabledSelection?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  microsoftGraphEnabled: boolean;
  microsoftGraphEnabledSelection?: string;
  microsoftRedirectUri?: string;
  microsoftTenantId?: string;
  port: number;
  scheduleProvider: ScheduleProviderId;
  scheduleProviderSelection?: string;
  teamsAppId?: string;
  version: string;
};

export type StartupValidation = {
  errors: string[];
  warnings: string[];
};

function getTrimmedEnv(
  env: NodeJS.ProcessEnv,
  name: string,
): string | undefined {
  const value = env[name];
  return value && value.length > 0 ? value.trim() : undefined;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "postgres:" || url.protocol === "postgresql:";
  } catch {
    return false;
  }
}

function parseBooleanEnv(value?: string): boolean {
  return value === "true";
}

function normalizeScheduleProviderId(
  value?: string,
): ScheduleProviderId {
  if (value === "microsoft-graph") {
    return "microsoft-graph";
  }

  return "neon-demo";
}

function normalizeAuthMode(value?: string): AuthProviderId {
  if (value === "microsoft-entra") {
    return "microsoft-entra";
  }

  return "preview-demo";
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function buildAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const entraClientId = getTrimmedEnv(env, "ENTRA_CLIENT_ID");
  const entraTenantId = getTrimmedEnv(env, "ENTRA_TENANT_ID");

  return {
    appBaseUrl: getTrimmedEnv(env, "APP_BASE_URL"),
    authMode: normalizeAuthMode(getTrimmedEnv(env, "AUTH_MODE")),
    authModeSelection: getTrimmedEnv(env, "AUTH_MODE"),
    documentationUrl: getTrimmedEnv(env, "APP_DOCUMENTATION_URL"),
    databaseUrl: getTrimmedEnv(env, "DATABASE_URL"),
    entraAppIdUri: getTrimmedEnv(env, "ENTRA_APP_ID_URI"),
    entraClientId,
    entraTenantId,
    feedbackEmail: getTrimmedEnv(env, "FEEDBACK_EMAIL"),
    microsoftAuthEnabled: parseBooleanEnv(
      getTrimmedEnv(env, "MICROSOFT_AUTH_ENABLED"),
    ),
    microsoftAuthEnabledSelection: getTrimmedEnv(
      env,
      "MICROSOFT_AUTH_ENABLED",
    ),
    microsoftClientId:
      getTrimmedEnv(env, "MICROSOFT_CLIENT_ID") ?? entraClientId,
    microsoftClientSecret: getTrimmedEnv(env, "MICROSOFT_CLIENT_SECRET"),
    microsoftGraphEnabled: parseBooleanEnv(
      getTrimmedEnv(env, "MICROSOFT_GRAPH_ENABLED"),
    ),
    microsoftGraphEnabledSelection: getTrimmedEnv(
      env,
      "MICROSOFT_GRAPH_ENABLED",
    ),
    microsoftRedirectUri: getTrimmedEnv(env, "MICROSOFT_REDIRECT_URI"),
    microsoftTenantId:
      getTrimmedEnv(env, "MICROSOFT_TENANT_ID") ?? entraTenantId,
    port: Number(env.PORT ?? "8787"),
    scheduleProvider: normalizeScheduleProviderId(
      getTrimmedEnv(env, "SCHEDULE_PROVIDER"),
    ),
    scheduleProviderSelection: getTrimmedEnv(env, "SCHEDULE_PROVIDER"),
    teamsAppId: getTrimmedEnv(env, "TEAMS_APP_ID"),
    version: packageJson.version,
  };
}

export function isTeamsSsoConfigured(config: AppConfig): boolean {
  return Boolean(
    config.entraAppIdUri && config.entraClientId && config.entraTenantId,
  );
}

export function isMicrosoftAuthConfigured(config: AppConfig): boolean {
  return Boolean(
    config.microsoftClientId &&
      config.microsoftTenantId &&
      config.microsoftRedirectUri,
  );
}

export function isMicrosoftGraphConfigured(config: AppConfig): boolean {
  return Boolean(config.microsoftClientId && config.microsoftTenantId);
}

export function validateAppConfig(config: AppConfig): StartupValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    errors.push("PORT must be an integer between 1 and 65535.");
  }

  if (config.appBaseUrl && !isValidHttpUrl(config.appBaseUrl)) {
    errors.push("APP_BASE_URL must be a valid http:// or https:// URL.");
  }

  if (config.documentationUrl && !isValidHttpUrl(config.documentationUrl)) {
    errors.push(
      "APP_DOCUMENTATION_URL must be a valid http:// or https:// URL.",
    );
  }

  if (config.databaseUrl && !isValidPostgresUrl(config.databaseUrl)) {
    errors.push(
      "DATABASE_URL must be a valid postgres:// or postgresql:// connection string.",
    );
  }

  if (config.feedbackEmail && !isValidEmail(config.feedbackEmail)) {
    errors.push("FEEDBACK_EMAIL must be a valid email address.");
  }

  if (
    config.microsoftRedirectUri &&
    !isValidHttpUrl(config.microsoftRedirectUri)
  ) {
    errors.push(
      "MICROSOFT_REDIRECT_URI must be a valid http:// or https:// URL.",
    );
  }

  if (
    config.authModeSelection &&
    config.authModeSelection !== "preview-demo" &&
    config.authModeSelection !== "microsoft-entra"
  ) {
    warnings.push(
      `AUTH_MODE "${config.authModeSelection}" is not supported. Falling back to "preview-demo".`,
    );
  }

  if (
    config.microsoftAuthEnabledSelection &&
    config.microsoftAuthEnabledSelection !== "false" &&
    config.microsoftAuthEnabledSelection !== "true"
  ) {
    warnings.push(
      `MICROSOFT_AUTH_ENABLED "${config.microsoftAuthEnabledSelection}" is not supported. Falling back to "false".`,
    );
  }

  if (
    config.microsoftGraphEnabledSelection &&
    config.microsoftGraphEnabledSelection !== "false" &&
    config.microsoftGraphEnabledSelection !== "true"
  ) {
    warnings.push(
      `MICROSOFT_GRAPH_ENABLED "${config.microsoftGraphEnabledSelection}" is not supported. Falling back to "false".`,
    );
  }

  if (
    config.scheduleProviderSelection &&
    config.scheduleProviderSelection !== "neon-demo" &&
    config.scheduleProviderSelection !== "microsoft-graph"
  ) {
    warnings.push(
      `SCHEDULE_PROVIDER "${config.scheduleProviderSelection}" is not supported. Falling back to "neon-demo".`,
    );
  }

  if (config.scheduleProvider === "microsoft-graph") {
    warnings.push(
      config.microsoftGraphEnabled
        ? 'SCHEDULE_PROVIDER is set to "microsoft-graph", but that provider remains a safe groundwork stub.'
        : 'SCHEDULE_PROVIDER is set to "microsoft-graph", but MICROSOFT_GRAPH_ENABLED is false so the app will stay in a safe disabled state.',
    );
  }

  const configuredSsoVariables = [
    "ENTRA_APP_ID_URI",
    "ENTRA_CLIENT_ID",
    "ENTRA_TENANT_ID",
  ].filter((name) => {
    if (name === "ENTRA_APP_ID_URI") {
      return Boolean(config.entraAppIdUri);
    }

    if (name === "ENTRA_CLIENT_ID") {
      return Boolean(config.entraClientId);
    }

    return Boolean(config.entraTenantId);
  });

  if (configuredSsoVariables.length > 0 && !isTeamsSsoConfigured(config)) {
    const missingVariables = [
      !config.entraAppIdUri ? "ENTRA_APP_ID_URI" : null,
      !config.entraClientId ? "ENTRA_CLIENT_ID" : null,
      !config.entraTenantId ? "ENTRA_TENANT_ID" : null,
    ].filter(Boolean);

    warnings.push(
      `Microsoft Entra configuration is incomplete. Missing: ${missingVariables.join(
        ", ",
      )}.`,
    );
  }

  if (config.microsoftAuthEnabled && !isMicrosoftAuthConfigured(config)) {
    const missingVariables = [
      !config.microsoftClientId ? "MICROSOFT_CLIENT_ID" : null,
      !config.microsoftTenantId ? "MICROSOFT_TENANT_ID" : null,
      !config.microsoftRedirectUri ? "MICROSOFT_REDIRECT_URI" : null,
    ].filter(Boolean);

    warnings.push(
      `Microsoft auth is enabled but incomplete. Missing: ${missingVariables.join(
        ", ",
      )}.`,
    );
  }

  if (config.microsoftGraphEnabled && !isMicrosoftGraphConfigured(config)) {
    const missingVariables = [
      !config.microsoftClientId ? "MICROSOFT_CLIENT_ID" : null,
      !config.microsoftTenantId ? "MICROSOFT_TENANT_ID" : null,
    ].filter(Boolean);

    warnings.push(
      `Microsoft Graph is enabled but incomplete. Missing: ${missingVariables.join(
        ", ",
      )}.`,
    );
  }

  if (config.authMode === "microsoft-entra") {
    warnings.push(
      !config.microsoftAuthEnabled
        ? 'AUTH_MODE is set to "microsoft-entra", but MICROSOFT_AUTH_ENABLED is false so the app will stay in a safe setup-needed state.'
        : isMicrosoftAuthConfigured(config)
          ? 'AUTH_MODE is set to "microsoft-entra", but that provider remains a safe groundwork stub.'
          : 'AUTH_MODE is set to "microsoft-entra", but Microsoft auth setup is incomplete. The app will stay in a safe setup-needed state.',
    );
  }

  if (!config.databaseUrl) {
    warnings.push(
      "DATABASE_URL is not configured. The API will use in-memory demo data only.",
    );
  }

  if (!config.feedbackEmail) {
    warnings.push(
      "FEEDBACK_EMAIL is not configured. Settings feedback actions will be unavailable.",
    );
  }

  return {
    errors,
    warnings,
  };
}

export const appConfig = buildAppConfig();
