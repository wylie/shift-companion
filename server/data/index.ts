import { hasDatabaseUrl } from "../db/connection";
import { createMockDataAccess } from "./mockDataAccess";
import { createPostgresDataAccess } from "./postgresDataAccess";

export function createDataAccess() {
  if (hasDatabaseUrl()) {
    return createPostgresDataAccess();
  }

  return createMockDataAccess();
}
