import { createApp } from "./app";
import { appConfig, isMicrosoftAuthConfigured, validateAppConfig } from "./config";
import { logError, logInfo, logWarn } from "./logger";

const startupValidation = validateAppConfig(appConfig);

if (startupValidation.errors.length > 0) {
  for (const error of startupValidation.errors) {
    logError("startup.validation_failed", new Error(error), {
      version: appConfig.version,
    });
  }

  process.exit(1);
}

for (const warning of startupValidation.warnings) {
  logWarn("startup.validation_warning", {
    message: warning,
    version: appConfig.version,
  });
}

const app = createApp();

app.listen(appConfig.port, () => {
  logInfo("startup.ready", {
    appBaseUrl: appConfig.appBaseUrl,
    authConfigured:
      appConfig.authMode === "preview-demo"
        ? true
        : isMicrosoftAuthConfigured(appConfig),
    authMode: appConfig.authMode,
    dataSource: appConfig.databaseUrl ? "postgres" : "in-memory",
    feedbackConfigured: Boolean(appConfig.feedbackEmail),
    port: appConfig.port,
    teamsSsoConfigured: Boolean(
      appConfig.entraAppIdUri &&
        appConfig.entraClientId &&
        appConfig.entraTenantId,
    ),
    version: appConfig.version,
  });
});
