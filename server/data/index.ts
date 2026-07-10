import { hasDatabaseUrl } from "../db/connection.js";
import { createMockDataAccess } from "./mockDataAccess.js";
import { createPostgresDataAccess } from "./postgresDataAccess.js";

export function createDataAccess() {
  if (hasDatabaseUrl()) {
    return createPostgresDataAccess();
  }

  return createMockDataAccess();
}
