import { afterEach, describe, expect, it } from "vitest";
import { createSign, generateKeyPairSync } from "node:crypto";
import {
  resetEntraValidationCaches,
  verifyEntraSsoToken,
} from "./entra";

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwt(payload: Record<string, unknown>, kid: string) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const header = {
    alg: "RS256",
    kid,
    typ: "JWT",
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  return {
    jwk: publicKey.export({ format: "jwk" }),
    token: `${signingInput}.${toBase64Url(signer.sign(privateKey))}`,
  };
}

afterEach(() => {
  resetEntraValidationCaches();
});

describe("verifyEntraSsoToken", () => {
  it("verifies a valid Teams SSO token and extracts stable identity fields", async () => {
    const tenantId = "11111111-2222-4333-8444-555555555555";
    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const { jwk, token } = signJwt(
      {
        aud: "api://client-id-123",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: issuer,
        name: "Jordan Lee",
        nbf: Math.floor(Date.now() / 1000) - 60,
        oid: "aaaaaaaa-bbbb-cccc-dddd-000000000001",
        preferred_username: "jordan.lee@exampleymca.org",
        tid: tenantId,
        ver: "2.0",
      },
      "kid-1",
    );

    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);

      if (url.endsWith("/.well-known/openid-configuration")) {
        return new Response(
          JSON.stringify({
            issuer,
            jwks_uri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          keys: [
            {
              ...jwk,
              kid: "kid-1",
              use: "sig",
            },
          ],
        }),
        { status: 200 },
      );
    };

    const identity = await verifyEntraSsoToken(token, {
      config: {
        appIdUri: "api://client-id-123",
        clientId: "client-id-123",
        tenantId,
      },
      fetchFn,
    });

    expect(identity.tenantId).toBe(tenantId);
    expect(identity.entraObjectId).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-000000000001",
    );
    expect(identity.userPrincipalName).toBe("jordan.lee@exampleymca.org");
    expect(identity.displayName).toBe("Jordan Lee");
  });

  it("rejects tokens for a different audience", async () => {
    const tenantId = "11111111-2222-4333-8444-555555555555";
    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const { jwk, token } = signJwt(
      {
        aud: "api://wrong-audience",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: issuer,
        nbf: Math.floor(Date.now() / 1000) - 60,
        oid: "aaaaaaaa-bbbb-cccc-dddd-000000000001",
        tid: tenantId,
        ver: "2.0",
      },
      "kid-2",
    );

    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);

      if (url.endsWith("/.well-known/openid-configuration")) {
        return new Response(
          JSON.stringify({
            issuer,
            jwks_uri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          keys: [
            {
              ...jwk,
              kid: "kid-2",
              use: "sig",
            },
          ],
        }),
        { status: 200 },
      );
    };

    await expect(
      verifyEntraSsoToken(token, {
        config: {
          appIdUri: "api://client-id-123",
          clientId: "client-id-123",
          tenantId,
        },
        fetchFn,
      }),
    ).rejects.toThrow("audience");
  });
});
