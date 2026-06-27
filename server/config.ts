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
  return {
    appBaseUrl: getTrimmedEnv(env, "APP_BASE_URL"),
    authMode: normalizeAuthMode(getTrimmedEnv(env, "AUTH_MODE")),
    authModeSelection: getTrimmedEnv(env, "AUTH_MODE"),
    documentationUrl: getTrimmedEnv(env, "APP_DOCUMENTATION_URL"),
    databaseUrl: getTrimmedEnv(env, "DATABASE_URL"),
    entraAppIdUri: getTrimmedEnv(env, "ENTRA_APP_ID_URI"),
    entraClientId: getTrimmedEnv(env, "ENTRA_CLIENT_ID"),
    entraTenantId: getTrimmedEnv(env, "ENTRA_TENANT_ID"),
    feedbackEmail: getTrimmedEnv(env, "FEEDBACK_EMAIL"),
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
    config.authModeSelection &&
    config.authModeSelection !== "preview-demo" &&
    config.authModeSelection !== "microsoft-entra"
  ) {
    warnings.push(
      `AUTH_MODE "${config.authModeSelection}" is not supported. Falling back to "preview-demo".`,
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
      'SCHEDULE_PROVIDER is set to "microsoft-graph", but that provider is still a non-functional Phase 6A stub.',
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

  if (config.authMode === "microsoft-entra") {
    warnings.push(
      isTeamsSsoConfigured(config)
        ? 'AUTH_MODE is set to "microsoft-entra", but that provider is still a safe Phase 6 stub.'
        : 'AUTH_MODE is set to "microsoft-entra", but Microsoft Entra setup is incomplete. The app will stay in a safe setup-needed state.',
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
