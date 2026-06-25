import "dotenv/config";

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const appConfig = {
  appBaseUrl: getOptionalEnv("APP_BASE_URL"),
  databaseUrl: getOptionalEnv("DATABASE_URL"),
  entraAppIdUri: getOptionalEnv("ENTRA_APP_ID_URI"),
  entraClientId: getOptionalEnv("ENTRA_CLIENT_ID"),
  entraTenantId: getOptionalEnv("ENTRA_TENANT_ID"),
  port: Number(process.env.PORT ?? "8787"),
  teamsAppId: getOptionalEnv("TEAMS_APP_ID"),
};
