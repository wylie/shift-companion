import { webcrypto } from "node:crypto";
import { appConfig } from "../config.js";

type FetchLike = typeof fetch;

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = {
  aud?: string;
  email?: string;
  exp?: number;
  iss?: string;
  name?: string;
  nbf?: number;
  oid?: string;
  preferred_username?: string;
  tid?: string;
  unique_name?: string;
  upn?: string;
  ver?: string;
};

type OidcMetadata = {
  issuer: string;
  jwks_uri: string;
};

type JsonWebKeyLike = {
  alg?: string;
  e?: string;
  ext?: boolean;
  kid?: string;
  kty?: string;
  n?: string;
  use?: string;
};

type JsonWebKeyWithIssuer = JsonWebKeyLike & {
  issuer?: string;
};

type JwksResponse = {
  keys: JsonWebKeyWithIssuer[];
};

export type EntraTokenValidationConfig = {
  appIdUri?: string;
  clientId?: string;
  tenantId?: string;
};

export type VerifiedEntraIdentity = {
  audience: string;
  displayName?: string;
  email?: string;
  entraObjectId?: string;
  issuer: string;
  tenantId: string;
  tokenVersion: "1.0" | "2.0";
  userPrincipalName?: string;
};

export class TeamsIdentityError extends Error {
  constructor(
    public readonly code:
      | "sso_not_configured"
      | "token_invalid"
      | "user_not_mapped",
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

const metadataCache = new Map<
  string,
  {
    expiresAt: number;
    value: OidcMetadata;
  }
>();
const jwksCache = new Map<
  string,
  {
    expiresAt: number;
    value: JwksResponse;
  }
>();
const cacheTtlMs = 60 * 60 * 1000;
const clockSkewSeconds = 300;

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function parseJwtSegment<T>(segment: string): T {
  const decoded = base64UrlToBuffer(segment).toString("utf8");
  return JSON.parse(decoded) as T;
}

function toUint8Array(value: string | Buffer): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(Buffer.from(value));
}

function normalizeIdentityValue(value?: string): string | undefined {
  return value?.trim().toLowerCase() || undefined;
}

function getValidationConfig(
  config: EntraTokenValidationConfig = {
    appIdUri: appConfig.entraAppIdUri,
    clientId: appConfig.entraClientId,
    tenantId: appConfig.entraTenantId,
  },
): EntraTokenValidationConfig {
  return config;
}

function ensureConfig(config: EntraTokenValidationConfig): Required<
  Pick<EntraTokenValidationConfig, "appIdUri" | "clientId">
> &
  Pick<EntraTokenValidationConfig, "tenantId"> {
  if (!config.clientId || !config.appIdUri) {
    throw new TeamsIdentityError(
      "sso_not_configured",
      "Teams SSO is not configured on the server yet.",
      503,
    );
  }

  return {
    appIdUri: config.appIdUri,
    clientId: config.clientId,
    tenantId: config.tenantId,
  };
}

function getAllowedAudiences(config: {
  appIdUri: string;
  clientId: string;
}): Set<string> {
  return new Set([config.appIdUri, config.clientId, `api://${config.clientId}`]);
}

async function fetchJson<T>(url: string, fetchFn: FetchLike): Promise<T> {
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed while loading Microsoft Entra metadata.",
      401,
    );
  }

  return response.json() as Promise<T>;
}

async function getCachedJson<T>(
  cache: Map<string, { expiresAt: number; value: T }>,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await loader();
  cache.set(key, {
    expiresAt: Date.now() + cacheTtlMs,
    value,
  });
  return value;
}

function getMetadataUrl(tenantId: string, version: "1.0" | "2.0"): string {
  return version === "1.0"
    ? `https://login.microsoftonline.com/${tenantId}/.well-known/openid-configuration`
    : `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
}

async function importVerificationKey(jwk: JsonWebKeyWithIssuer) {
  return webcrypto.subtle.importKey(
    "jwk",
    {
      alg: "RS256",
      e: jwk.e,
      ext: true,
      kty: "RSA",
      n: jwk.n,
    },
    {
      hash: "SHA-256",
      name: "RSASSA-PKCS1-v1_5",
    },
    false,
    ["verify"],
  );
}

async function verifyJwtSignature(params: {
  fetchFn: FetchLike;
  header: JwtHeader;
  metadata: OidcMetadata;
  payload: JwtPayload;
  signature: string;
  signingInput: string;
}) {
  const { fetchFn, header, metadata, payload, signature, signingInput } = params;

  if (!header.kid) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the signing key identifier is missing.",
      401,
    );
  }

  const jwks = await getCachedJson(jwksCache, metadata.jwks_uri, () =>
    fetchJson<JwksResponse>(metadata.jwks_uri, fetchFn),
  );

  const key = jwks.keys.find((candidate) => candidate.kid === header.kid);

  if (!key || key.kty !== "RSA" || key.use !== "sig" || !key.n || !key.e) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the Microsoft Entra signing key was not found.",
      401,
    );
  }

  if (
    key.issuer &&
    typeof payload.iss === "string" &&
    key.issuer !== payload.iss &&
    key.issuer !== "https://login.microsoftonline.com/{tenantid}/v2.0"
  ) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the signing key issuer did not match the token issuer.",
      401,
    );
  }

  const cryptoKey = await importVerificationKey(key);
  const isValid = await webcrypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    toUint8Array(base64UrlToBuffer(signature)),
    toUint8Array(signingInput),
  );

  if (!isValid) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token signature verification failed.",
      401,
    );
  }
}

export function resetEntraValidationCaches() {
  metadataCache.clear();
  jwksCache.clear();
}

export async function verifyEntraSsoToken(
  token: string,
  options: {
    config?: EntraTokenValidationConfig;
    fetchFn?: FetchLike;
  } = {},
): Promise<VerifiedEntraIdentity> {
  const config = ensureConfig(getValidationConfig(options.config));
  const fetchFn = options.fetchFn ?? fetch;
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token shape is invalid.",
      401,
    );
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtSegment<JwtHeader>(encodedHeader);
  const payload = parseJwtSegment<JwtPayload>(encodedPayload);

  if (header.alg !== "RS256") {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token algorithm is unsupported.",
      401,
    );
  }

  if (typeof payload.tid !== "string" || !isGuid(payload.tid)) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the tenant claim is missing or invalid.",
      401,
    );
  }

  if (config.tenantId && payload.tid !== config.tenantId) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token tenant does not match the configured tenant.",
      401,
    );
  }

  const tokenVersion: "1.0" | "2.0" = payload.ver === "1.0" ? "1.0" : "2.0";
  const metadataUrl = getMetadataUrl(payload.tid, tokenVersion);
  const metadata = await getCachedJson(metadataCache, metadataUrl, () =>
    fetchJson<OidcMetadata>(metadataUrl, fetchFn),
  );

  if (typeof payload.iss !== "string" || payload.iss !== metadata.issuer) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token issuer is invalid.",
      401,
    );
  }

  if (typeof payload.aud !== "string" || !getAllowedAudiences(config).has(payload.aud)) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token audience does not match this app.",
      401,
    );
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (
    typeof payload.nbf === "number" &&
    payload.nbf > nowInSeconds + clockSkewSeconds
  ) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token is not active yet.",
      401,
    );
  }

  if (
    typeof payload.exp !== "number" ||
    payload.exp <= nowInSeconds - clockSkewSeconds
  ) {
    throw new TeamsIdentityError(
      "token_invalid",
      "Teams token verification failed because the token has expired.",
      401,
    );
  }

  await verifyJwtSignature({
    fetchFn,
    header,
    metadata,
    payload,
    signature: encodedSignature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
  });

  return {
    audience: payload.aud,
    displayName: typeof payload.name === "string" ? payload.name : undefined,
    email: normalizeIdentityValue(
      typeof payload.email === "string" ? payload.email : undefined,
    ),
    entraObjectId:
      typeof payload.oid === "string" ? payload.oid : undefined,
    issuer: payload.iss,
    tenantId: payload.tid,
    tokenVersion,
    userPrincipalName: normalizeIdentityValue(
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : typeof payload.upn === "string"
          ? payload.upn
          : typeof payload.unique_name === "string"
            ? payload.unique_name
            : undefined,
    ),
  };
}
