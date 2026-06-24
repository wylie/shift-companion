import { app } from "@microsoft/teams-js";

export async function initializeTeamsSdk(): Promise<boolean> {
  try {
    if (!app.isInitialized()) {
      await app.initialize();
    }

    return true;
  } catch {
    return false;
  }
}
