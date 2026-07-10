import type { AuthProviderId, ScheduleProviderId } from "../../src/types.js";
import type { AppConfig } from "../config.js";
import type { AppDataAccess } from "../data/types.js";
import { createMicrosoftEntraAuthProvider } from "../auth/providers/microsoftEntraAuthProvider.js";
import { createPreviewAuthProvider } from "../auth/providers/previewAuthProvider.js";
import type { AuthProvider } from "../auth/types.js";
import { createEmailFeedbackProvider } from "./feedback/emailFeedbackProvider.js";
import { createMicrosoftGraphScheduleProvider } from "./schedule/microsoftGraphScheduleProvider.js";
import { createNeonDemoScheduleProvider } from "./schedule/neonDemoScheduleProvider.js";
import type {
  CalendarExportProvider,
  FeedbackProvider,
  ProviderDiagnostics,
  ScheduleProvider,
} from "./types.js";

export type IntegrationRegistry = {
  getAuthProvider(providerId?: AuthProviderId): AuthProvider;
  getCalendarExportProvider(): CalendarExportProvider;
  getFeedbackProvider(): FeedbackProvider;
  getProviderDiagnostics(): Promise<ProviderDiagnostics>;
  getScheduleProvider(providerId?: ScheduleProviderId): ScheduleProvider;
};

export function createIntegrationRegistry(params: {
  config: AppConfig;
  dataAccess: AppDataAccess;
}): IntegrationRegistry {
  const previewAuthProvider = createPreviewAuthProvider(params.dataAccess);
  const microsoftEntraAuthProvider = createMicrosoftEntraAuthProvider(
    params.config,
  );
  const neonScheduleProvider = createNeonDemoScheduleProvider(params.dataAccess);
  const microsoftGraphScheduleProvider = createMicrosoftGraphScheduleProvider(
    params.config,
  );
  const feedbackProvider = createEmailFeedbackProvider(params.config);

  function getAuthProvider(providerId = params.config.authMode): AuthProvider {
    if (providerId === "microsoft-entra") {
      return microsoftEntraAuthProvider;
    }

    return previewAuthProvider;
  }

  function getScheduleProvider(
    providerId = params.config.scheduleProvider,
  ): ScheduleProvider {
    if (providerId === "microsoft-graph") {
      return microsoftGraphScheduleProvider;
    }

    return neonScheduleProvider;
  }

  return {
    getAuthProvider,
    getCalendarExportProvider() {
      return getScheduleProvider();
    },
    getFeedbackProvider() {
      return feedbackProvider;
    },
    async getProviderDiagnostics() {
      const [auth, calendarExport, feedback, schedule] = await Promise.all([
        getAuthProvider().getProviderStatus(),
        getScheduleProvider().getProviderStatus(),
        feedbackProvider.getProviderStatus(),
        getScheduleProvider().getProviderStatus(),
      ]);

      return {
        auth,
        calendarExport,
        feedback,
        schedule,
      };
    },
    getScheduleProvider,
  };
}
