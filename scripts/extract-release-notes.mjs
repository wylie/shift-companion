#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const outputPath =
  process.argv[2] ??
  process.env.GITHUB_RELEASE_NOTES_PATH ??
  path.join(repoRoot, "release-notes.md");

function getTagName() {
  return process.argv[3] ?? process.env.GITHUB_REF_NAME;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFallbackNotes(tagName, version) {
  return [
    `# Teams Shifts Companion ${tagName}`,
    "",
    `Automated release for version ${version}.`,
    "",
    "Full details remain in `CHANGELOG.md`.",
    "",
    "Limitation: release notes fell back to a generated summary because the matching changelog section could not be extracted automatically.",
    "",
  ].join("\n");
}

async function main() {
  const tagName = getTagName();

  if (!tagName) {
    process.stderr.write(
      "Release notes extraction failed: no tag was provided. Pass an output path and tag, or set GITHUB_REF_NAME.\n",
    );
    process.exit(1);
  }

  const version = tagName.startsWith("v") ? tagName.slice(1) : tagName;
  const changelog = await fs.readFile(changelogPath, "utf8");
  const lines = changelog.split(/\r?\n/);
  const sectionHeaderPattern = new RegExp(
    `^## \\[${escapeRegExp(version)}\\] - `,
  );
  const headerIndex = lines.findIndex((line) =>
    sectionHeaderPattern.test(line),
  );
  let sectionBody;

  if (headerIndex !== -1) {
    const sectionLines = [];

    for (let index = headerIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];

      if (line.startsWith("## [")) {
        break;
      }

      sectionLines.push(line);
    }

    sectionBody = sectionLines.join("\n").trim();
  }

  const notes = sectionBody
    ? [`# Teams Shifts Companion ${tagName}`, "", sectionBody, ""].join("\n")
    : buildFallbackNotes(tagName, version);

  await fs.writeFile(outputPath, notes, "utf8");
  process.stdout.write(
    `Release notes written to ${path.relative(repoRoot, outputPath)} for ${tagName}.\n`,
  );
}

await main();
