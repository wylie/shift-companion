import { describe, expect, it } from "vitest";
import {
  buildErrorResponse,
  getStatusCode,
  HttpError,
  hasStatusCode,
} from "./errors.js";

describe("HTTP error helpers", () => {
  it("preserves application status codes for expected errors", () => {
    const error = new HttpError(404, "Not found.");

    expect(hasStatusCode(error)).toBe(true);
    expect(getStatusCode(error)).toBe(404);
    expect(buildErrorResponse(error, "req-123")).toEqual({
      payload: {
        error: "Not found.",
        requestId: "req-123",
        statusCode: 404,
      },
      statusCode: 404,
    });
  });

  it("returns a safe generic 500 response for unknown errors", () => {
    const error = new Error("Database connection failed.");

    expect(getStatusCode(error)).toBe(500);
    expect(buildErrorResponse(error)).toEqual({
      payload: {
        error: "Something went wrong. Please try again.",
        requestId: undefined,
        statusCode: 500,
      },
      statusCode: 500,
    });
  });
});
