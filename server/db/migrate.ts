import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, closePool } from "./connection";

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationPath = path.join(
    __dirname,
    "migrations",
    "0000_phase3_persistence.sql",
  );
  const sql = await readFile(migrationPath, "utf8");
  const pool = createPool();

  await pool.query(sql);
  await closePool();
  console.log("Applied migration 0000_phase3_persistence.sql");
}

main().catch(async (error) => {
  console.error("Migration failed.");
  console.error(error);
  await closePool();
  process.exitCode = 1;
});
