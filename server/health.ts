import type { AppHealthResponse, HealthCheck } from "../src/types.js";
import type { AppConfig } from "./config.js";
import { appConfig, isMicrosoftAuthConfigured, isTeamsSsoConfigured } from "./config.js";
import { createPool, hasDatabaseUrl } from "./db/connection.js";

async function getDatabaseHealthCheck(
  isDatabaseConfigured: boolean,
): Promise<HealthCheck> {
  if (!isDatabaseConfigured) {
    return {
      details: "DATABASE_URL is not configured. The API is using in-memory demo data.",
      name: "database",
      status: "skipped",
    };
  }

  try {
    await createPool().query("select 1");

    return {
      details: "Postgres connection is available.",
      name: "database",
      status: "ok",
    };
  } catch (error) {
    return {
      details:
        error instanceof Error
          ? error.message
          : "Postgres connectivity check failed.",
      name: "database",
      status: "error",
    };
  }
}

export async function buildHealthSnapshot(params: {
  config: AppConfig;
  isDatabaseConfigured: boolean;
}): Promise<AppHealthResponse> {
  const checks = [await getDatabaseHealthCheck(params.isDatabaseConfigured)];
  const hasFailingCheck = checks.some((check) => check.status === "error");

  return {
    checks,
    runtime: {
      authConfigured:
        params.config.authMode === "preview-demo"
          ? true
          : isMicrosoftAuthConfigured(params.config),
      authMode: params.config.authMode,
      dataSource: params.isDatabaseConfigured ? "postgres" : "in-memory",
      feedbackConfigured: Boolean(params.config.feedbackEmail),
      teamsSsoConfigured: isTeamsSsoConfigured(params.config),
    },
    status: hasFailingCheck ? "error" : "ok",
    timestamp: new Date().toISOString(),
    version: params.config.version,
  };
}

export async function getHealthSnapshot(): Promise<AppHealthResponse> {
  return buildHealthSnapshot({
    config: appConfig,
    isDatabaseConfigured: hasDatabaseUrl(),
  });
}
