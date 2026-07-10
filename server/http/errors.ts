import type { AppErrorResponse } from "../../src/types.js";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

type ErrorWithStatusCode = {
  statusCode: number;
};

export function hasStatusCode(error: unknown): error is ErrorWithStatusCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  );
}

export function getStatusCode(error: unknown): number {
  if (!hasStatusCode(error)) {
    return 500;
  }

  return error.statusCode >= 400 && error.statusCode <= 599
    ? error.statusCode
    : 500;
}

export function buildErrorResponse(
  error: unknown,
  requestId?: string,
): {
  payload: AppErrorResponse;
  statusCode: number;
} {
  const statusCode = getStatusCode(error);

  return {
    payload: {
      error:
        statusCode >= 500
          ? "Something went wrong. Please try again."
          : error instanceof Error
            ? error.message
            : "Request failed.",
      requestId,
      statusCode,
    },
    statusCode,
  };
}
