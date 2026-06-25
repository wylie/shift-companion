import { readFileSync } from "node:fs";
import path from "node:path";

const defaultTeamsEnv = {
  TEAMS_APP_ID: "00000000-0000-4000-8000-000000000001",
  TEAMS_APP_NAME_FULL: "Teams Shifts Companion",
  TEAMS_APP_NAME_SHORT: "Shifts Companion",
  TEAMS_DEVELOPER_NAME: "Example YMCA Developer",
  TEAMS_DEVELOPER_WEBSITE_URL: "https://example.com",
  TEAMS_PRIVACY_POLICY_URL: "https://example.com/privacy",
  TEAMS_TAB_BASE_URL: "https://localhost:53000",
  TEAMS_TERMS_OF_USE_URL: "https://example.com/terms",
  TEAMS_VALID_DOMAINS: "localhost,127.0.0.1",
};

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getTeamsManifestConfig() {
  const baseUrl =
    process.env.TEAMS_TAB_BASE_URL ?? defaultTeamsEnv.TEAMS_TAB_BASE_URL;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const configuredDomains = (
    process.env.TEAMS_VALID_DOMAINS ?? defaultTeamsEnv.TEAMS_VALID_DOMAINS
  )
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
  const derivedHost = new URL(normalizedBaseUrl).hostname;
  const validDomains = Array.from(new Set([derivedHost, ...configuredDomains]));

  return {
    appId: process.env.TEAMS_APP_ID ?? defaultTeamsEnv.TEAMS_APP_ID,
    developerName:
      process.env.TEAMS_DEVELOPER_NAME ?? defaultTeamsEnv.TEAMS_DEVELOPER_NAME,
    developerWebsiteUrl:
      process.env.TEAMS_DEVELOPER_WEBSITE_URL ??
      defaultTeamsEnv.TEAMS_DEVELOPER_WEBSITE_URL,
    fullName:
      process.env.TEAMS_APP_NAME_FULL ?? defaultTeamsEnv.TEAMS_APP_NAME_FULL,
    privacyPolicyUrl:
      process.env.TEAMS_PRIVACY_POLICY_URL ??
      defaultTeamsEnv.TEAMS_PRIVACY_POLICY_URL,
    shortName:
      process.env.TEAMS_APP_NAME_SHORT ?? defaultTeamsEnv.TEAMS_APP_NAME_SHORT,
    tabContentUrl: normalizedBaseUrl,
    tabWebsiteUrl: normalizedBaseUrl,
    termsOfUseUrl:
      process.env.TEAMS_TERMS_OF_USE_URL ?? defaultTeamsEnv.TEAMS_TERMS_OF_USE_URL,
    validDomains,
  };
}

export function buildManifest() {
  const config = getTeamsManifestConfig();
  const templatePath = path.resolve("teams-app", "manifest.template.json");
  let manifestTemplate = readFileSync(templatePath, "utf8");

  const replacements = {
    TEAMS_APP_ID: config.appId,
    TEAMS_APP_NAME_FULL: config.fullName,
    TEAMS_APP_NAME_SHORT: config.shortName,
    TEAMS_DEVELOPER_NAME: config.developerName,
    TEAMS_DEVELOPER_WEBSITE_URL: config.developerWebsiteUrl,
    TEAMS_PRIVACY_POLICY_URL: config.privacyPolicyUrl,
    TEAMS_TAB_CONTENT_URL: config.tabContentUrl,
    TEAMS_TAB_WEBSITE_URL: config.tabWebsiteUrl,
    TEAMS_TERMS_OF_USE_URL: config.termsOfUseUrl,
    TEAMS_VALID_DOMAINS_JSON: JSON.stringify(config.validDomains),
  };

  for (const [token, value] of Object.entries(replacements)) {
    manifestTemplate = manifestTemplate.replace(
      new RegExp(`{{${escapeForRegExp(token)}}}`, "g"),
      value,
    );
  }

  return JSON.parse(manifestTemplate);
}

export function validateManifest(manifest) {
  const errors = [];

  if (!manifest.id) {
    errors.push("Manifest is missing id.");
  }

  if (!manifest.staticTabs?.length) {
    errors.push("Manifest must include at least one static tab.");
  }

  if (!manifest.icons?.color || !manifest.icons?.outline) {
    errors.push("Manifest must reference both color and outline icons.");
  }

  if (!Array.isArray(manifest.validDomains) || manifest.validDomains.length === 0) {
    errors.push("Manifest must include at least one valid domain.");
  }

  return errors;
}
