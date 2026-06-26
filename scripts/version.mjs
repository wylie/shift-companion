#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const command = process.argv[2] ?? "current";
const repoRoot = path.resolve(import.meta.dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function readProjectVersion() {
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  return packageJson.version;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runCurrent() {
  const version = await readProjectVersion();
  process.stdout.write(`${version}\n`);
}

async function runCheck() {
  const version = await readProjectVersion();
  const changelog = await fs.readFile(changelogPath, "utf8");
  const errors = [];

  if (!semverPattern.test(version)) {
    errors.push(`package.json version "${version}" is not valid SemVer.`);
  }

  if (!changelog.includes("## [Unreleased]")) {
    errors.push('CHANGELOG.md must include an "## [Unreleased]" section.');
  }

  const releasedVersionPattern = new RegExp(
    `## \\[${escapeRegExp(version)}\\] - \\d{4}-\\d{2}-\\d{2}`,
  );

  if (!releasedVersionPattern.test(changelog)) {
    errors.push(
      `CHANGELOG.md must include a released section for ${version} using "## [${version}] - YYYY-MM-DD".`,
    );
  }

  if (errors.length > 0) {
    process.stderr.write(`Version check failed:\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }

  process.stdout.write(`Version check passed for ${version}.\n`);
}

if (command === "current") {
  await runCurrent();
} else if (command === "check") {
  await runCheck();
} else {
  process.stderr.write(
    `Unknown command "${command}". Use "current" or "check".\n`,
  );
  process.exit(1);
}
