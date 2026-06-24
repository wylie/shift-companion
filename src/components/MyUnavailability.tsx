import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { appRepositories } from "../data/repositories";
import type {
  CurrentUser,
  UnavailabilityRule,
  UnavailabilityRuleType,
} from "../types";

type Props = {
  currentUser: CurrentUser;
};

type RuleDraft = {
  type: UnavailabilityRuleType;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  date: string;
  startDate: string;
  endDate: string;
  note: string;
};

type RuleField =
  | "dayOfWeek"
  | "startTime"
  | "endTime"
  | "date"
  | "startDate"
  | "endDate";

type FieldErrors = Partial<Record<RuleField, string>>;

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const groupedRuleTypes: Array<{
  type: UnavailabilityRuleType;
  label: string;
}> = [
  { type: "weekly-recurring", label: "Weekly recurring" },
  { type: "one-time-date", label: "One-time date" },
  { type: "date-range", label: "Date range" },
];

const emptyDraft: RuleDraft = {
  type: "weekly-recurring",
  dayOfWeek: "Monday",
  startTime: "",
  endTime: "",
  date: "",
  startDate: "",
  endDate: "",
  note: "",
};

function renderFieldMessage(message?: string, id?: string) {
  return (
    <span
      aria-live="polite"
      className={message ? "field-message field-error" : "field-message"}
      id={id}
    >
      {message ?? ""}
    </span>
  );
}

function createDraftFromRule(rule: UnavailabilityRule): RuleDraft {
  return {
    type: rule.type,
    dayOfWeek: rule.dayOfWeek ?? "Monday",
    startTime: rule.startTime ?? "",
    endTime: rule.endTime ?? "",
    date: rule.date ?? "",
    startDate: rule.startDate ?? "",
    endDate: rule.endDate ?? "",
    note: rule.note,
  };
}

function buildRuleFromDraft(
  draft: RuleDraft,
  userId: string,
  existingId?: string,
): UnavailabilityRule {
  const baseRule: UnavailabilityRule = {
    id: existingId ?? `ua-${Date.now()}`,
    userId,
    type: draft.type,
    note: draft.note.trim(),
  };

  if (draft.type === "weekly-recurring") {
    return {
      ...baseRule,
      dayOfWeek: draft.dayOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
    };
  }

  if (draft.type === "one-time-date") {
    return {
      ...baseRule,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
    };
  }

  return {
    ...baseRule,
    startDate: draft.startDate,
    endDate: draft.endDate,
  };
}

function validateDraft(draft: RuleDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (draft.type === "weekly-recurring") {
    if (!draft.startTime) {
      errors.startTime = "Start time is required.";
    }

    if (!draft.endTime) {
      errors.endTime = "End time is required.";
    }

    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
      errors.endTime = "End time must be after start time.";
    }
  }

  if (draft.type === "one-time-date") {
    if (!draft.date) {
      errors.date = "Date is required.";
    }

    if (!draft.startTime) {
      errors.startTime = "Start time is required.";
    }

    if (!draft.endTime) {
      errors.endTime = "End time is required.";
    }

    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
      errors.endTime = "End time must be after start time.";
    }
  }

  if (draft.type === "date-range") {
    if (!draft.startDate) {
      errors.startDate = "Start date is required.";
    }

    if (!draft.endDate) {
      errors.endDate = "End date is required.";
    }

    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      errors.endDate = "End date cannot be before start date.";
    }
  }

  return errors;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2026-01-01T${value}:00`));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatRuleSummary(rule: UnavailabilityRule): string {
  if (rule.type === "weekly-recurring") {
    return `Every ${rule.dayOfWeek}, ${formatTime(rule.startTime ?? "")}-${formatTime(rule.endTime ?? "")}`;
  }

  if (rule.type === "one-time-date") {
    return `${formatDate(rule.date ?? "")}, ${formatTime(rule.startTime ?? "")}-${formatTime(rule.endTime ?? "")}`;
  }

  return `${formatDate(rule.startDate ?? "")} to ${formatDate(rule.endDate ?? "")}`;
}

export function MyUnavailability({ currentUser }: Props) {
  const [rules, setRules] = useState(() =>
    // Future persistence should load only the signed-in staff member's rules.
    appRepositories.unavailabilityRules.listForUser(currentUser.id),
  );
  const [draft, setDraft] = useState<RuleDraft>(emptyDraft);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // Future persistence and user filtering should refresh rules for the active user.
    setRules(appRepositories.unavailabilityRules.listForUser(currentUser.id));
    setDraft(emptyDraft);
    setEditingRuleId(null);
    setFieldErrors({});
    setDeleteCandidateId(null);
  }, [currentUser.id]);

  const groupedRules = useMemo(
    () =>
      groupedRuleTypes.map((group) => ({
        ...group,
        rules: rules.filter((rule) => rule.type === group.type),
      })),
    [rules],
  );

  function resetForm() {
    setDraft(emptyDraft);
    setEditingRuleId(null);
    setFieldErrors({});
  }

  function handleDraftChange<Key extends keyof RuleDraft>(
    key: Key,
    value: RuleDraft[Key],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[key as RuleField]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[key as RuleField];
      return nextErrors;
    });
  }

  function handleRuleTypeChange(type: UnavailabilityRuleType) {
    setDraft({
      ...emptyDraft,
      type,
      note: draft.note,
    });
    setFieldErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateDraft(draft);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const nextRule = buildRuleFromDraft(
      draft,
      currentUser.id,
      editingRuleId ?? undefined,
    );

    setRules((currentRules) => {
      if (editingRuleId) {
        appRepositories.unavailabilityRules.save(nextRule);
        return currentRules.map((rule) =>
          rule.id === editingRuleId ? nextRule : rule,
        );
      }

      // Future persistence should write user-scoped rule changes to the backend.
      appRepositories.unavailabilityRules.save(nextRule);
      return [...currentRules, nextRule];
    });

    resetForm();
  }

  function handleEdit(rule: UnavailabilityRule) {
    setDraft(createDraftFromRule(rule));
    setEditingRuleId(rule.id);
    setFieldErrors({});
    setDeleteCandidateId(null);
  }

  function requestDelete(ruleId: string) {
    setDeleteCandidateId(ruleId);
  }

  function cancelDelete() {
    setDeleteCandidateId(null);
  }

  function confirmDelete(ruleId: string) {
    appRepositories.unavailabilityRules.delete(ruleId);
    setRules((currentRules) =>
      currentRules.filter((rule) => rule.id !== ruleId),
    );
    setDeleteCandidateId(null);

    if (editingRuleId === ruleId) {
      resetForm();
    }
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Unavailability</p>
          <h2>Manage unavailable times</h2>
        </div>
        <span className="pill">Local state only</span>
      </div>

      <p className="lead">
        Staff enter and manage their own unavailable times here. Manager
        visibility comes later and is intentionally excluded from this flow.
      </p>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-header">
          <div>
            <h3>
              {editingRuleId ? "Edit unavailable rule" : "Add unavailable rule"}
            </h3>
            <p className="muted">
              Add the times you cannot work. Recurring rules are best for
              regular commitments; date ranges are best for trips, school
              breaks, or extended conflicts.
            </p>
          </div>
          {editingRuleId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>

        <div className="form-grid">
          <label className="field">
            Rule type
            <select
              className="select-control"
              value={draft.type}
              onChange={(event) =>
                handleRuleTypeChange(
                  event.target.value as UnavailabilityRuleType,
                )
              }
            >
              {groupedRuleTypes.map((group) => (
                <option key={group.type} value={group.type}>
                  {group.label}
                </option>
              ))}
            </select>
            {renderFieldMessage()}
          </label>

          {draft.type === "weekly-recurring" && (
            <>
              <label className="field">
                Day of week
                <select
                  className="select-control"
                  value={draft.dayOfWeek}
                  onChange={(event) =>
                    handleDraftChange("dayOfWeek", event.target.value)
                  }
                >
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                {renderFieldMessage()}
              </label>

              <label className="field">
                Start time
                <input
                  aria-describedby={
                    fieldErrors.startTime
                      ? "unavailability-start-time-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.startTime)}
                  type="time"
                  value={draft.startTime}
                  onChange={(event) =>
                    handleDraftChange("startTime", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.startTime,
                  "unavailability-start-time-error",
                )}
              </label>

              <label className="field">
                End time
                <input
                  aria-describedby={
                    fieldErrors.endTime
                      ? "unavailability-end-time-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.endTime)}
                  type="time"
                  value={draft.endTime}
                  onChange={(event) =>
                    handleDraftChange("endTime", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.endTime,
                  "unavailability-end-time-error",
                )}
              </label>
            </>
          )}

          {draft.type === "one-time-date" && (
            <>
              <label className="field">
                Date
                <input
                  aria-describedby={
                    fieldErrors.date ? "unavailability-date-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.date)}
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    handleDraftChange("date", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.date,
                  "unavailability-date-error",
                )}
              </label>

              <label className="field">
                Start time
                <input
                  aria-describedby={
                    fieldErrors.startTime
                      ? "unavailability-start-time-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.startTime)}
                  type="time"
                  value={draft.startTime}
                  onChange={(event) =>
                    handleDraftChange("startTime", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.startTime,
                  "unavailability-start-time-error",
                )}
              </label>

              <label className="field">
                End time
                <input
                  aria-describedby={
                    fieldErrors.endTime
                      ? "unavailability-end-time-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.endTime)}
                  type="time"
                  value={draft.endTime}
                  onChange={(event) =>
                    handleDraftChange("endTime", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.endTime,
                  "unavailability-end-time-error",
                )}
              </label>
            </>
          )}

          {draft.type === "date-range" && (
            <>
              <label className="field">
                Start date
                <input
                  aria-describedby={
                    fieldErrors.startDate
                      ? "unavailability-start-date-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.startDate)}
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    handleDraftChange("startDate", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.startDate,
                  "unavailability-start-date-error",
                )}
              </label>

              <label className="field">
                End date
                <input
                  aria-describedby={
                    fieldErrors.endDate
                      ? "unavailability-end-date-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.endDate)}
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    handleDraftChange("endDate", event.target.value)
                  }
                />
                {renderFieldMessage(
                  fieldErrors.endDate,
                  "unavailability-end-date-error",
                )}
              </label>
            </>
          )}

          <label className="field field-full">
            Optional note
            <textarea
              rows={3}
              value={draft.note}
              onChange={(event) =>
                handleDraftChange("note", event.target.value)
              }
              placeholder="Add context for this unavailable time."
            />
            {renderFieldMessage()}
          </label>
        </div>

        <div className="form-actions">
          <button className="primary-button" type="submit">
            {editingRuleId ? "Save changes" : "Add rule"}
          </button>
          {editingRuleId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="rules-stack">
        {groupedRules.map((group) => (
          <section className="rules-group" key={group.type}>
            <div className="group-header">
              <h3>{group.label}</h3>
              <span className="muted">{group.rules.length} rules</span>
            </div>

            {group.rules.length > 0 ? (
              <div className="card-grid">
                {group.rules.map((rule) => (
                  <article className="card" key={rule.id}>
                    <h3>{formatRuleSummary(rule)}</h3>
                    <p className="muted">
                      {rule.note || "No note added for this unavailable rule."}
                    </p>

                    {deleteCandidateId === rule.id ? (
                      <div className="inline-confirmation" role="alert">
                        <p>Delete this unavailable rule?</p>
                        <div className="card-actions">
                          <button
                            className="ghost-button ghost-button-danger"
                            type="button"
                            onClick={() => confirmDelete(rule.id)}
                          >
                            Confirm delete
                          </button>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={cancelDelete}
                          >
                            Keep rule
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="card-actions">
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => handleEdit(rule)}
                        >
                          Edit
                        </button>
                        <button
                          className="ghost-button ghost-button-danger"
                          type="button"
                          onClick={() => requestDelete(rule.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <article className="card empty-state">
                <h3>No {group.label.toLowerCase()} rules yet</h3>
                <p className="muted">
                  Add one to keep your schedule aligned with the times you
                  cannot work.
                </p>
              </article>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
