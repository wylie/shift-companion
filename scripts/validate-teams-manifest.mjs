import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { buildManifest, validateManifest } from "./teams-manifest-utils.mjs";

const manifest = buildManifest();
const errors = validateManifest(manifest);

for (const iconName of ["color.png", "outline.png"]) {
  const iconPath = path.resolve("teams-app", iconName);

  if (!existsSync(iconPath)) {
    errors.push(`Missing Teams app icon: ${iconName}`);
  }
}

if (errors.length > 0) {
  console.error("Teams manifest validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Teams manifest validation passed.");
}
