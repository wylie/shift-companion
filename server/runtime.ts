import { createApp } from "./app.js";
import { appConfig, isMicrosoftAuthConfigured, validateAppConfig } from "./config.js";
import { logError, logInfo, logWarn } from "./logger.js";

let appInstance: ReturnType<typeof createApp> | undefined;
let startupValidated = false;

function validateStartup() {
  if (startupValidated) {
    return;
  }

  const startupValidation = validateAppConfig(appConfig);

  if (startupValidation.errors.length > 0) {
    for (const error of startupValidation.errors) {
      logError("startup.validation_failed", new Error(error), {
        version: appConfig.version,
      });
    }

    throw new Error("Application startup validation failed.");
  }

  for (const warning of startupValidation.warnings) {
    logWarn("startup.validation_warning", {
      message: warning,
      version: appConfig.version,
    });
  }

  startupValidated = true;
}

export function getApp() {
  validateStartup();

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance;
}

export function logRuntimeReady(options: {
  deploymentTarget: "local-express" | "vercel-function";
  port?: number;
}) {
  logInfo("startup.ready", {
    appBaseUrl: appConfig.appBaseUrl,
    authConfigured:
      appConfig.authMode === "preview-demo"
        ? true
        : isMicrosoftAuthConfigured(appConfig),
    authMode: appConfig.authMode,
    dataSource: appConfig.databaseUrl ? "postgres" : "in-memory",
    deploymentTarget: options.deploymentTarget,
    feedbackConfigured: Boolean(appConfig.feedbackEmail),
    port: options.port,
    teamsSsoConfigured: Boolean(
      appConfig.entraAppIdUri &&
        appConfig.entraClientId &&
        appConfig.entraTenantId,
    ),
    version: appConfig.version,
  });
}
