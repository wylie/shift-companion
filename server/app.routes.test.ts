import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, expect, it } from "vitest";
import {
  buildCalendarSubscriptionFeedPath,
  calendarSubscriptionCreatePath,
  calendarSubscriptionFeedRoutePath,
  calendarSubscriptionRegeneratePath,
  calendarSubscriptionRevokePath,
  calendarSubscriptionStatusPath,
} from "../src/lib/calendarRoutes.js";
import type {
  CalendarSubscriptionSecret,
  CalendarSubscriptionStatus,
} from "../src/types.js";
import { createMockDataAccess } from "./data/mockDataAccess.js";
import { createApp } from "./app.js";

type RouteLayer = {
  route?: {
    methods?: Record<string, boolean>;
    path?: string;
  };
};

type MockResponse = {
  body: string;
  headers: Record<string, string | string[] | undefined>;
  statusCode: number;
};

function getRegisteredRoutes() {
  const app = createApp({
    dataAccess: createMockDataAccess(),
  });
  const stack = ((app as unknown as { router?: { stack?: RouteLayer[] } }).router
    ?.stack ?? []) as RouteLayer[];

  return stack
    .filter((layer) => layer.route?.path)
    .map((layer) => ({
      methods: Object.keys(layer.route?.methods ?? {}).sort(),
      path: layer.route?.path ?? "",
    }));
}

async function invokeApp(params: {
  body?: unknown;
  dataAccess?: ReturnType<typeof createMockDataAccess>;
  headers?: Record<string, string>;
  method: "DELETE" | "GET" | "POST";
  path: string;
}): Promise<MockResponse> {
  const app = createApp({
    dataAccess: params.dataAccess ?? createMockDataAccess(),
  });
  const socket = new Socket();
  const request = new IncomingMessage(socket);
  const response = new ServerResponse(request);
  const chunks: Buffer[] = [];

  request.method = params.method;
  request.url = params.path;
  request.headers = {
    host: "example.test",
    "x-app-runtime": "browserPreview",
    "x-preview-user-id": "user-staff-1",
    ...(params.headers ?? {}),
  };

  if (params.body !== undefined) {
    const rawBody = JSON.stringify(params.body);
    request.headers["content-length"] = String(Buffer.byteLength(rawBody));
    request.headers["content-type"] = "application/json";
    request.push(rawBody);
  }

  request.push(null);

  const originalWrite = response.write.bind(response);
  const originalEnd = response.end.bind(response);

  response.write = ((chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }

    return originalWrite(chunk, encoding, callback);
  }) as typeof response.write;

  return new Promise<MockResponse>((resolve, reject) => {
    response.end = ((chunk, encoding, callback) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      const result = {
        body: Buffer.concat(chunks).toString("utf8"),
        headers: response.getHeaders(),
        statusCode: response.statusCode,
      };

      const returnValue = originalEnd(chunk, encoding, callback);
      resolve(result);
      return returnValue;
    }) as typeof response.end;

    response.once("error", reject);
    app.handle(request, response);
  });
}

function parseJson<T>(response: MockResponse): T {
  return JSON.parse(response.body) as T;
}

describe("Express calendar subscription routes", () => {
  it("registers the calendar subscription management and feed routes", () => {
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["get"],
      path: calendarSubscriptionStatusPath,
    });
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["post"],
      path: calendarSubscriptionCreatePath,
    });
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["post"],
      path: calendarSubscriptionRegeneratePath,
    });
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["delete"],
      path: calendarSubscriptionRevokePath,
    });
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["get"],
      path: calendarSubscriptionFeedRoutePath,
    });
  });

  it("returns subscription status with 200", async () => {
    const response = await invokeApp({
      method: "GET",
      path: calendarSubscriptionStatusPath,
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson<CalendarSubscriptionStatus>(response)).toEqual({
      active: false,
    });
  });

  it("creates a private subscription URL and returns the raw URL once", async () => {
    const response = await invokeApp({
      method: "POST",
      path: calendarSubscriptionCreatePath,
    });
    const payload = parseJson<CalendarSubscriptionSecret>(response);

    expect(response.statusCode).toBe(200);
    expect(payload.status.active).toBe(true);
    expect(payload.subscriptionUrl).toContain("/api/calendar/subscriptions/");
  });

  it("regenerates the subscription and invalidates the previous token", async () => {
    const dataAccess = createMockDataAccess();
    const created = parseJson<CalendarSubscriptionSecret>(
      await invokeApp({
        dataAccess,
        method: "POST",
        path: calendarSubscriptionCreatePath,
      }),
    );
    const regenerated = parseJson<CalendarSubscriptionSecret>(
      await invokeApp({
        dataAccess,
        method: "POST",
        path: calendarSubscriptionRegeneratePath,
      }),
    );
    const oldFeedResponse = await invokeApp({
      dataAccess,
      headers: {
        "x-app-runtime": "teams",
      },
      method: "GET",
      path: new URL(created.subscriptionUrl).pathname,
    });
    const newFeedResponse = await invokeApp({
      dataAccess,
      headers: {
        "x-app-runtime": "teams",
      },
      method: "GET",
      path: new URL(regenerated.subscriptionUrl).pathname,
    });

    expect(regenerated.subscriptionUrl).not.toBe(created.subscriptionUrl);
    expect(oldFeedResponse.statusCode).toBe(404);
    expect(oldFeedResponse.body).toBe("Not found.");
    expect(newFeedResponse.statusCode).toBe(200);
    expect(newFeedResponse.body).toContain("BEGIN:VCALENDAR");
  });

  it("revokes the current subscription", async () => {
    const dataAccess = createMockDataAccess();

    await invokeApp({
      dataAccess,
      method: "POST",
      path: calendarSubscriptionCreatePath,
    });

    const response = await invokeApp({
      dataAccess,
      method: "DELETE",
      path: calendarSubscriptionRevokePath,
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson<CalendarSubscriptionStatus>(response)).toMatchObject({
      active: false,
    });
  });

  it("returns a safe JSON 404 for unknown calendar API paths", async () => {
    const response = await invokeApp({
      method: "GET",
      path: "/api/calendar/unknown",
    });
    const payload = parseJson<{ error: string; statusCode: number }>(response);

    expect(response.statusCode).toBe(404);
    expect(payload).toMatchObject({
      error: "Not found.",
      statusCode: 404,
    });
  });

  it("keeps the public ICS feed route working", async () => {
    const dataAccess = createMockDataAccess();
    const created = parseJson<CalendarSubscriptionSecret>(
      await invokeApp({
        dataAccess,
        method: "POST",
        path: calendarSubscriptionCreatePath,
      }),
    );
    const token = created.subscriptionUrl.split("/").at(-2);

    expect(token).toBeTruthy();

    const response = await invokeApp({
      dataAccess,
      headers: {
        "x-app-runtime": "teams",
      },
      method: "GET",
      path: buildCalendarSubscriptionFeedPath(token!),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.body).toContain("BEGIN:VCALENDAR");
  });
});
