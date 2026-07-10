import type {
  ProviderCapability,
  ProviderStatus,
  Shift,
} from "../../src/types.js";
import type { AuthProviderStatus } from "../auth/types.js";

export type ScheduleProviderId = "microsoft-graph" | "neon-demo";

export type IntegrationProviderStatus = ProviderStatus & {
  providerId: ScheduleProviderId;
};

export type FeedbackProviderStatus = ProviderStatus & {
  providerId: "feedback-email";
};

export type ScheduleRangeParams = {
  endDate: Date;
  startDate: Date;
  userId: string;
};

export type CurrentUserShiftParams = {
  shiftId: string;
  userId: string;
};

export type ScheduleProviderResult<T> =
  | {
      data: T;
      ok: true;
      status: IntegrationProviderStatus;
    }
  | {
      errorCode: "disabled" | "not_configured" | "not_implemented";
      message: string;
      ok: false;
      status: IntegrationProviderStatus;
    };

export type ScheduleProvider = {
  getCurrentUserScheduleRange(
    params: ScheduleRangeParams,
  ): Promise<ScheduleProviderResult<Shift[]>>;
  getCurrentUserShiftById(
    params: CurrentUserShiftParams,
  ): Promise<ScheduleProviderResult<Shift | undefined>>;
  getProviderStatus(): Promise<IntegrationProviderStatus>;
};

export type CalendarExportProvider = Pick<
  ScheduleProvider,
  "getCurrentUserScheduleRange" | "getProviderStatus"
>;

export type FeedbackProvider = {
  getFeedbackEmail(): string | undefined;
  getProviderStatus(): Promise<FeedbackProviderStatus>;
};

export type ProviderDiagnostics = {
  auth: AuthProviderStatus;
  calendarExport: IntegrationProviderStatus;
  feedback: FeedbackProviderStatus;
  schedule: IntegrationProviderStatus;
};

export const readOnlyScheduleCapabilities: ProviderCapability[] = [
  "calendarExport",
  "readSchedule",
];
