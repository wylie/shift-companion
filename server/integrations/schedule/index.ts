import type { AppDataAccess } from "../../data/types.js";
import type { AppConfig } from "../../config.js";
import type { ScheduleProvider } from "../types.js";
import { createMicrosoftGraphScheduleProvider } from "./microsoftGraphScheduleProvider.js";
import { createNeonDemoScheduleProvider } from "./neonDemoScheduleProvider.js";

export function createScheduleProvider(params: {
  config: AppConfig;
  dataAccess: AppDataAccess;
}): ScheduleProvider {
  if (params.config.scheduleProvider === "microsoft-graph") {
    return createMicrosoftGraphScheduleProvider(params.config);
  }

  return createNeonDemoScheduleProvider(params.dataAccess);
}
