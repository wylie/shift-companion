import type { AppDataAccess } from "../../data/types";
import type { IntegrationProviderStatus, ScheduleProvider } from "../types";
import { readOnlyScheduleCapabilities } from "../types";
import {
  mapNeonShiftRecordToScheduleShift,
  mapNeonShiftRecordsToScheduleShifts,
} from "../mappers/neonScheduleMapper";
import { filterShiftsByRange } from "./utils";

const status: IntegrationProviderStatus = {
  availability: "available",
  capabilities: readOnlyScheduleCapabilities,
  configured: true,
  enabled: true,
  message:
    "Using the persisted Neon/demo schedule provider backed by the current repository layer.",
  name: "NeonScheduleProvider",
  providerId: "neon-demo",
  version: "0.2.0",
};

export function createNeonDemoScheduleProvider(
  dataAccess: AppDataAccess,
): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange({ endDate, startDate, userId }) {
      const shifts = await dataAccess.shifts.listForUser(userId);

      return {
        data: filterShiftsByRange(mapNeonShiftRecordsToScheduleShifts(shifts), {
          endDate,
          startDate,
        }),
        ok: true,
        status,
      };
    },
    async getCurrentUserShiftById({ shiftId, userId }) {
      const shifts = await dataAccess.shifts.listForUser(userId);
      const shift = shifts.find((item) => item.id === shiftId);

      return {
        data: shift ? mapNeonShiftRecordToScheduleShift(shift) : undefined,
        ok: true,
        status,
      };
    },
    async getProviderStatus() {
      return status;
    },
  };
}
