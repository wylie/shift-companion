import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCalendarIcs } from "../src/lib/calendar";
import type { AppErrorResponse } from "../src/types";
import { startOfWeek } from "../src/lib/date";
import type { AppRuntimeMode, UnavailabilityRuleInput } from "../src/types";
import { getHealthSnapshot } from "./health";
import { createDataAccess } from "./data";
import { HttpError } from "./http/errors";
import { logError, logInfo, logWarn } from "./logger";
import { AppService } from "./services/appService";

type RequestContext = {
  appRuntime: AppRuntimeMode;
  bearerToken?: string;
  previewUserId?: string;
};

function getRequestContext(request: express.Request): RequestContext {
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

function parseWeekStart(value: unknown): Date {
  if (typeof value !== "string" || value.length === 0) {
    return startOfWeek(new Date("2026-06-24T12:00:00"));
  }

  return startOfWeek(new Date(`${value}T12:00:00`));
}

function parseCalendarWeeks(value: unknown): 1 | 4 {
  return value === "4" ? 4 : 1;
}

export function createApp() {
  const app = express();
  const dataAccess = createDataAccess();
  const appService = new AppService(dataAccess);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "../dist");

  app.use(express.json());
  app.use((request, response, next) => {
    const requestId = randomUUID();
    const startedAt = Date.now();

    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);

    response.on("finish", () => {
      const eventName =
        response.statusCode >= 500
          ? "request.failed"
          : response.statusCode >= 400
            ? "request.rejected"
            : "request.completed";
      const log = response.statusCode >= 400 ? logWarn : logInfo;

      log(eventName, {
        durationMs: Date.now() - startedAt,
        method: request.method,
        path: request.originalUrl,
        requestId,
        statusCode: response.statusCode,
      });
    });

    next();
  });

  app.get("/api/health", async (_request, response, next) => {
    try {
      const snapshot = await getHealthSnapshot();
      response.status(snapshot.status === "ok" ? 200 : 503).json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bootstrap", async (request, response, next) => {
    try {
      const bootstrap = await appService.getBootstrap(getRequestContext(request));
      response.json(bootstrap);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response.json(await appService.listOwnUnavailability(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response
        .status(201)
        .json(
          await appService.createOwnUnavailability(
            currentUser,
            request.body as UnavailabilityRuleInput,
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/unavailability/:ruleId", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response.json(
        await appService.updateOwnUnavailability(
          currentUser,
          request.params.ruleId,
          request.body as UnavailabilityRuleInput,
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/unavailability/:ruleId", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      await appService.deleteOwnUnavailability(
        currentUser,
        request.params.ruleId,
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/schedule", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response.json(await appService.listOwnShifts(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager-review", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response.json(
        await appService.getManagerReview(
          currentUser,
          typeof request.query.departmentId === "string"
            ? request.query.departmentId
            : undefined,
          parseWeekStart(request.query.weekStart),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/manager-review/log", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response
        .status(201)
        .json(
          await appService.recordManagerReview(
            currentUser,
            String(request.body.departmentId),
            parseWeekStart(request.body.weekStart),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/settings/audit-events", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      response.json(await appService.listOwnAuditEvents(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/calendar.ics", async (request, response, next) => {
    try {
      const currentUser = await appService.getCurrentUserForRequest(
        getRequestContext(request),
      );
      const shifts = await appService.getOwnCalendarShifts(
        currentUser,
        parseWeekStart(request.query.weekStart),
        parseCalendarWeeks(request.query.weeks),
      );
      const ics = buildCalendarIcs(shifts);

      response
        .status(200)
        .setHeader("Content-Type", "text/calendar; charset=utf-8")
        .setHeader(
          "Content-Disposition",
          'attachment; filename="my-shifts.ics"',
        )
        .send(ics);
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(distPath));

  app.use((request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next(new HttpError(404, "Not found."));
      return;
    }

    response.sendFile(path.join(distPath, "index.html"));
  });

  app.use(
    (error: Error, request: express.Request, response: express.Response) => {
      const statusCode = error instanceof HttpError ? error.statusCode : 500;
      const requestId = response.locals.requestId as string | undefined;

      if (statusCode >= 500) {
        logError("request.exception", error, {
          method: request.method,
          path: request.originalUrl,
          requestId,
          statusCode,
        });
      }

      const payload: AppErrorResponse = {
        error:
          statusCode >= 500
            ? "Something went wrong. Please try again."
            : error.message,
        requestId,
        statusCode,
      };

      response.status(statusCode).json(payload);
    },
  );

  return app;
}
