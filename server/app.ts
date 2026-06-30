import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCalendarIcs } from "../src/lib/calendar";
import type { AppErrorResponse } from "../src/types";
import { startOfWeek } from "../src/lib/date";
import type { UnavailabilityRuleInput } from "../src/types";
import { resolveRequestUser } from "./auth/requestContext";
import { appConfig } from "./config";
import { getHealthSnapshot } from "./health";
import { createDataAccess } from "./data";
import { HttpError } from "./http/errors";
import { createIntegrationRegistry } from "./integrations/registry";
import { logError, logInfo, logWarn } from "./logger";
import { AppService } from "./services/appService";

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
  const integrationRegistry = createIntegrationRegistry({
    config: appConfig,
    dataAccess,
  });
  const appService = new AppService(dataAccess, {
    integrationRegistry,
  });
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
      const bootstrap = await appService.getBootstrap(resolveRequestUser(request));
      response.json(bootstrap);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response.json(await appService.listOwnUnavailability(currentUser.currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response
        .status(201)
        .json(
          await appService.createOwnUnavailability(
            currentUser.currentUser,
            request.body as UnavailabilityRuleInput,
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/unavailability/:ruleId", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response.json(
        await appService.updateOwnUnavailability(
          currentUser.currentUser,
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
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      await appService.deleteOwnUnavailability(
        currentUser.currentUser,
        request.params.ruleId,
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/schedule", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response.json(await appService.listOwnShifts(currentUser.currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager-review", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response.json(
        await appService.getManagerReview(
          currentUser.currentUser,
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
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response
        .status(201)
        .json(
          await appService.recordManagerReview(
            currentUser.currentUser,
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
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      response.json(await appService.listOwnAuditEvents(currentUser.currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/calendar.ics", async (request, response, next) => {
    try {
      const currentUser = await appService.requireCurrentUser(
        resolveRequestUser(request),
      );
      const shifts = await appService.getOwnCalendarShifts(
        currentUser.currentUser,
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
