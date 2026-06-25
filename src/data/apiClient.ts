import type {
  AppBootstrap,
  AuditEvent,
  ManagerReviewData,
  Shift,
  UnavailabilityRule,
  UnavailabilityRuleInput,
} from "../types";

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  previewUserId: string;
};

async function requestJson<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.previewUserId) {
    headers["x-preview-user-id"] = options.previewUserId;
  }

  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
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
  async downloadCalendar(
    previewUserId: string,
    weekStart: string,
    weeks: 1 | 4,
  ) {
    const response = await fetch(
      `/api/calendar.ics?weekStart=${encodeURIComponent(
        weekStart,
      )}&weeks=${weeks}`,
      {
        headers: previewUserId
          ? {
              "x-preview-user-id": previewUserId,
            }
          : undefined,
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Calendar download failed.");
    }

    return response.blob();
  },
};
