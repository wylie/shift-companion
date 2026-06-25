import "dotenv/config";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { buildManifest, validateManifest } from "./teams-manifest-utils.mjs";

const distDir = path.resolve("teams-app", "dist");
const stagingDir = path.join(distDir, "package");
const packagePath = path.join(distDir, "teams-shifts-companion.zip");

rmSync(distDir, { force: true, recursive: true });
mkdirSync(stagingDir, { recursive: true });

const manifest = buildManifest();
const errors = validateManifest(manifest);

if (errors.length > 0) {
  console.error("Teams package build failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
  process.exit();
}

writeFileSync(
  path.join(stagingDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
copyFileSync(path.resolve("teams-app", "color.png"), path.join(stagingDir, "color.png"));
copyFileSync(
  path.resolve("teams-app", "outline.png"),
  path.join(stagingDir, "outline.png"),
);

execFileSync(
  "zip",
  ["-j", packagePath, "manifest.json", "color.png", "outline.png"],
  {
    cwd: stagingDir,
    stdio: "inherit",
  },
);

console.log(`Created Teams app package at ${packagePath}`);
