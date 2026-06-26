import type { AppDataAccess } from "../../data/types";
import type {
  IntegrationProviderStatus,
  ScheduleProvider,
} from "../types";
import { filterShiftsByRange } from "./utils";

const status: IntegrationProviderStatus = {
  availability: "available",
  message:
    "Using the persisted Neon/demo schedule provider backed by the current repository layer.",
  providerId: "neon-demo",
};

export function createNeonDemoScheduleProvider(
  dataAccess: AppDataAccess,
): ScheduleProvider {
  return {
    async getCurrentUserScheduleRange({ endDate, startDate, userId }) {
      const shifts = await dataAccess.shifts.listForUser(userId);

      return {
        data: filterShiftsByRange(shifts, {
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
        data: shift,
        ok: true,
        status,
      };
    },
    async getProviderStatus() {
      return status;
    },
  };
}
