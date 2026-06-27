#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");

async function readPackageVersion() {
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const version = packageJson.version;

  if (typeof version !== "string" || version.length === 0) {
    throw new Error('package.json must contain a non-empty string "version".');
  }

  return version;
}

function resolveTagName() {
  return process.argv[2] ?? process.env.GITHUB_REF_NAME;
}

function normalizeTagVersion(tagName) {
  return tagName.startsWith("v") ? tagName.slice(1) : tagName;
}

async function main() {
  const packageVersion = await readPackageVersion();
  const tagName = resolveTagName();

  if (!tagName) {
    process.stderr.write(
      "Release version check failed: no tag was provided. Pass a tag like v0.1.0 or set GITHUB_REF_NAME.\n",
    );
    process.exit(1);
  }

  const tagVersion = normalizeTagVersion(tagName.trim());

  if (tagVersion !== packageVersion) {
    process.stderr.write(
      `Release version check failed: tag "${tagName}" resolves to "${tagVersion}", but package.json version is "${packageVersion}".\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `Release version check passed: tag "${tagName}" matches package.json version "${packageVersion}".\n`,
  );
}

await main();
