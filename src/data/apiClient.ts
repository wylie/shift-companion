import type {
  AppRuntimeMode,
  AppBootstrap,
  AppErrorResponse,
  AuditEvent,
  CalendarSubscriptionSecret,
  CalendarSubscriptionStatus,
  ManagerReviewData,
  Shift,
  UnavailabilityRule,
  UnavailabilityRuleInput,
} from "../types";
import {
  calendarDownloadPath,
  calendarSubscriptionCreatePath,
  calendarSubscriptionRegeneratePath,
  calendarSubscriptionRevokePath,
  calendarSubscriptionStatusPath,
} from "../lib/calendarRoutes.js";

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  previewUserId: string;
};

type ApiClientSession = {
  previewUserId?: string;
  runtimeMode: AppRuntimeMode;
  teamsAuthToken?: string;
};

class ApiClientError extends Error {
  requestId?: string;
  statusCode?: number;

  constructor(message: string, options?: Pick<ApiClientError, "requestId" | "statusCode">) {
    super(message);
    this.name = "ApiClientError";
    this.requestId = options?.requestId;
    this.statusCode = options?.statusCode;
  }
}

let apiClientSession: ApiClientSession = {
  runtimeMode: "browserPreview",
};

function buildHeaders(previewUserId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-runtime": apiClientSession.runtimeMode,
  };

  if (
    apiClientSession.runtimeMode === "browserPreview" &&
    (previewUserId || apiClientSession.previewUserId)
  ) {
    headers["x-preview-user-id"] = previewUserId || apiClientSession.previewUserId!;
  }

  if (
    apiClientSession.runtimeMode === "teams" &&
    apiClientSession.teamsAuthToken
  ) {
    headers.authorization = `Bearer ${apiClientSession.teamsAuthToken}`;
  }

  return headers;
}

async function requestJson<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers: buildHeaders(options.previewUserId),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError(
      "Unable to reach the API. Start the local server and try again.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | AppErrorResponse
      | null;
    const message = payload?.requestId
      ? `${payload.error ?? "Request failed."} Reference: ${payload.requestId}.`
      : payload?.error ?? "Request failed.";

    throw new ApiClientError(message, {
      requestId: payload?.requestId,
      statusCode: payload?.statusCode ?? response.status,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  configureSession(session: ApiClientSession) {
    apiClientSession = session;
  },
  deleteUnavailabilityRule(previewUserId: string, ruleId: string) {
    return requestJson<void>(`/api/unavailability/${ruleId}`, {
      method: "DELETE",
      previewUserId,
    });
  },
  getAuditEvents(previewUserId: string) {
    return requestJson<AuditEvent[]>("/api/settings/audit-events", {
      previewUserId,
    });
  },
  getBootstrap(previewUserId?: string) {
    const query = previewUserId
      ? `?previewUserId=${encodeURIComponent(previewUserId)}`
      : "";

    return requestJson<AppBootstrap>(`/api/bootstrap${query}`, {
      previewUserId: previewUserId ?? "",
    });
  },
  getManagerReview(
    previewUserId: string,
    params: { departmentId?: string; weekStart: string },
  ) {
    const search = new URLSearchParams({
      weekStart: params.weekStart,
    });

    if (params.departmentId) {
      search.set("departmentId", params.departmentId);
    }

    return requestJson<ManagerReviewData>(`/api/manager-review?${search}`, {
      previewUserId,
    });
  },
  getMySchedule(previewUserId: string) {
    return requestJson<Shift[]>("/api/schedule", {
      previewUserId,
    });
  },
  getMyUnavailability(previewUserId: string) {
    return requestJson<UnavailabilityRule[]>("/api/unavailability", {
      previewUserId,
    });
  },
  async logManagerReview(
    previewUserId: string,
    input: { departmentId: string; weekStart: string },
  ) {
    return requestJson<AuditEvent>("/api/manager-review/log", {
      method: "POST",
      previewUserId,
      body: input,
    });
  },
  createUnavailabilityRule(
    previewUserId: string,
    input: UnavailabilityRuleInput,
  ) {
    return requestJson<UnavailabilityRule>("/api/unavailability", {
      method: "POST",
      previewUserId,
      body: input,
    });
  },
  createCalendarSubscription(previewUserId: string) {
    return requestJson<CalendarSubscriptionSecret>(calendarSubscriptionCreatePath, {
      method: "POST",
      previewUserId,
    });
  },
  regenerateCalendarSubscription(previewUserId: string) {
    return requestJson<CalendarSubscriptionSecret>(
      calendarSubscriptionRegeneratePath,
      {
        method: "POST",
        previewUserId,
      },
    );
  },
  updateUnavailabilityRule(
    previewUserId: string,
    ruleId: string,
    input: UnavailabilityRuleInput,
  ) {
    return requestJson<UnavailabilityRule>(`/api/unavailability/${ruleId}`, {
      method: "PUT",
      previewUserId,
      body: input,
    });
  },
  getCalendarSubscriptionStatus(previewUserId: string) {
    return requestJson<CalendarSubscriptionStatus>(
      calendarSubscriptionStatusPath,
      {
        previewUserId,
      },
    );
  },
  revokeCalendarSubscription(previewUserId: string) {
    return requestJson<CalendarSubscriptionStatus>(
      calendarSubscriptionRevokePath,
      {
        method: "DELETE",
        previewUserId,
      },
    );
  },
  async downloadCalendar(
    previewUserId: string,
    weekStart: string,
    weeks: 1 | 4,
  ) {
    let response: Response;

    try {
      response = await fetch(
        `${calendarDownloadPath}?weekStart=${encodeURIComponent(
          weekStart,
        )}&weeks=${weeks}`,
        {
          headers: buildHeaders(previewUserId),
        },
      );
    } catch {
      throw new ApiClientError(
        "Unable to reach the API. Start the local server and try again.",
      );
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | AppErrorResponse
        | null;
      const message = payload?.requestId
        ? `${payload.error ?? "Calendar download failed."} Reference: ${payload.requestId}.`
        : payload?.error ?? "Calendar download failed.";

      throw new ApiClientError(message, {
        requestId: payload?.requestId,
        statusCode: payload?.statusCode ?? response.status,
      });
    }

    return response.blob();
  },
};
