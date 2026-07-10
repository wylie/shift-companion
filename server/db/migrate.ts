import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, closePool } from "./connection.js";

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.join(__dirname, "migrations");
  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
  const pool = createPool();

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    const sql = await readFile(migrationPath, "utf8");
    await pool.query(sql);
    console.log(`Applied migration ${migrationFile}`);
  }

  await closePool();
}

main().catch(async (error) => {
  console.error("Migration failed.");
  console.error(error);
  await closePool();
  process.exitCode = 1;
});
