import type express from "express";
import type { AuthRequestContext } from "./types.js";

export function resolveRequestUser(
  request: express.Request,
): AuthRequestContext {
  const authorizationHeader = request.header("authorization");
  const headerUserId = request.header("x-preview-user-id");
  const runtimeHeader = request.header("x-app-runtime");
  const queryUserId =
    typeof request.query.previewUserId === "string"
      ? request.query.previewUserId
      : undefined;
  const bearerToken =
    authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length).trim()
      : undefined;

  return {
    appRuntime: runtimeHeader === "teams" ? "teams" : "browserPreview",
    bearerToken: bearerToken || undefined,
    previewUserId: headerUserId || queryUserId,
  };
}
