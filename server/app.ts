import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCalendarIcs } from "../src/lib/calendar";
import { startOfWeek } from "../src/lib/date";
import type { UnavailabilityRuleInput } from "../src/types";
import { createDataAccess } from "./data";
import { HttpError } from "./http/errors";
import { AppService } from "./services/appService";

type RequestContext = {
  previewUserId?: string;
};

function getRequestContext(request: express.Request): RequestContext {
  const headerUserId = request.header("x-preview-user-id");
  const queryUserId =
    typeof request.query.previewUserId === "string"
      ? request.query.previewUserId
      : undefined;

  return {
    previewUserId: headerUserId || queryUserId,
  };
}

function parseWeekStart(value: unknown): Date {
  if (typeof value !== "string" || value.length === 0) {
    return startOfWeek(new Date("2026-06-24T12:00:00"));
  }

  return startOfWeek(new Date(`${value}T12:00:00`));
}

export function createApp() {
  const app = express();
  const dataAccess = createDataAccess();
  const appService = new AppService(dataAccess);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "../dist");

  app.use(express.json());

  app.get("/api/bootstrap", async (request, response, next) => {
    try {
      const bootstrap = await appService.getBootstrap(
        getRequestContext(request).previewUserId,
      );
      response.json(bootstrap);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
      );
      response.json(await appService.listOwnUnavailability(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/unavailability", async (request, response, next) => {
    try {
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
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
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
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
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
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
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
      );
      response.json(await appService.listOwnShifts(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager-review", async (request, response, next) => {
    try {
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
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
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
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
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
      );
      response.json(await appService.listOwnAuditEvents(currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/calendar.ics", async (request, response, next) => {
    try {
      const currentUser = await appService.getPreviewUser(
        getRequestContext(request).previewUserId,
      );
      const shifts = await appService.getOwnCalendarShifts(
        currentUser,
        parseWeekStart(request.query.weekStart),
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

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next(new HttpError(404, "Not found."));
      return;
    }

    response.sendFile(path.join(distPath, "index.html"));
  });

  app.use(
    (error: Error, _request: express.Request, response: express.Response) => {
      const statusCode = error instanceof HttpError ? error.statusCode : 500;

      if (statusCode >= 500) {
        console.error(error);
      }

      response.status(statusCode).json({
        error:
          statusCode >= 500
            ? "Something went wrong. Please try again."
            : error.message,
      });
    },
  );

  return app;
}
