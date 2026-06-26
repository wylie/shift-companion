import type { Shift } from "../../src/types";

export type ScheduleProviderId = "microsoft-graph" | "neon-demo";

export type IntegrationProviderAvailability =
  | "available"
  | "not_configured"
  | "not_implemented";

export type IntegrationProviderStatus = {
  availability: IntegrationProviderAvailability;
  message: string;
  providerId: ScheduleProviderId;
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
      errorCode: "not_configured" | "not_implemented";
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

export type IdentityProvider = {
  getProviderStatus(): Promise<IntegrationProviderStatus>;
};

export type CalendarExportProvider = Pick<
  ScheduleProvider,
  "getCurrentUserScheduleRange" | "getProviderStatus"
>;

export type AvailabilityProvider = {
  getProviderStatus(): Promise<IntegrationProviderStatus>;
};
