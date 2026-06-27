import type { AppDataAccess } from "../../data/types";
import type { AppConfig } from "../../config";
import type { ScheduleProvider } from "../types";
import { createMicrosoftGraphScheduleProvider } from "./microsoftGraphScheduleProvider";
import { createNeonDemoScheduleProvider } from "./neonDemoScheduleProvider";

export function createScheduleProvider(params: {
  config: AppConfig;
  dataAccess: AppDataAccess;
}): ScheduleProvider {
  if (params.config.scheduleProvider === "microsoft-graph") {
    return createMicrosoftGraphScheduleProvider(params.config);
  }

  return createNeonDemoScheduleProvider(params.dataAccess);
}
