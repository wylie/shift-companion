import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../data/apiClient";
import {
  formatUnavailabilityRuleSummary,
  getRuleDays,
  normalizeUnavailabilityRule,
} from "../lib/unavailability";
import type {
  CurrentUser,
  UnavailabilityRule,
  UnavailabilityRuleInput,
  UnavailabilityRuleType,
} from "../types";

type Props = {
  currentUser: CurrentUser;
};

type RuleDraft = UnavailabilityRuleInput;

type RuleField =
  | "daysOfWeek"
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
  daysOfWeek: [],
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
  const normalizedRule = normalizeUnavailabilityRule(rule);

  return {
    type: normalizedRule.type,
    daysOfWeek: getRuleDays(normalizedRule),
    startTime: normalizedRule.startTime ?? "",
    endTime: normalizedRule.endTime ?? "",
    date: normalizedRule.date ?? "",
    startDate: normalizedRule.startDate ?? "",
    endDate: normalizedRule.endDate ?? "",
    note: normalizedRule.note,
  };
}

function validateDraft(draft: RuleDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (draft.type === "weekly-recurring") {
    if (draft.daysOfWeek.length === 0) {
      errors.daysOfWeek = "Select at least one day.";
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

export function MyUnavailability({ currentUser }: Props) {
  const [rules, setRules] = useState<UnavailabilityRule[]>([]);
  const [draft, setDraft] = useState<RuleDraft>(emptyDraft);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRules() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRules = await apiClient.getMyUnavailability(currentUser.id);

        if (!isCancelled) {
          setRules(nextRules.map(normalizeUnavailabilityRule));
          setDraft(emptyDraft);
          setEditingRuleId(null);
          setFieldErrors({});
          setDeleteCandidateId(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load unavailable rules.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRules();

    return () => {
      isCancelled = true;
    };
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

  function handleWeeklyDayToggle(day: string) {
    setDraft((currentDraft) => {
      const hasDay = currentDraft.daysOfWeek.includes(day);
      return {
        ...currentDraft,
        daysOfWeek: hasDay
          ? currentDraft.daysOfWeek.filter((item) => item !== day)
          : [...currentDraft.daysOfWeek, day],
      };
    });

    setFieldErrors((currentErrors) => {
      if (!currentErrors.daysOfWeek) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors.daysOfWeek;
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateDraft(draft);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedRule = normalizeUnavailabilityRule(
        editingRuleId
          ? await apiClient.updateUnavailabilityRule(
              currentUser.id,
              editingRuleId,
              draft,
            )
          : await apiClient.createUnavailabilityRule(currentUser.id, draft),
      );

      setRules((currentRules) => {
        if (editingRuleId) {
          return currentRules.map((rule) =>
            rule.id === editingRuleId ? savedRule : rule,
          );
        }

        return [...currentRules, savedRule];
      });

      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save rule.",
      );
    } finally {
      setIsSaving(false);
    }
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

  async function confirmDelete(ruleId: string) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await apiClient.deleteUnavailabilityRule(currentUser.id, ruleId);
      setRules((currentRules) =>
        currentRules.filter((rule) => rule.id !== ruleId),
      );
      setDeleteCandidateId(null);

      if (editingRuleId === ruleId) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete rule.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Unavailability</p>
          <h2>Manage unavailable times</h2>
        </div>
        <span className="pill">Persisted demo data</span>
      </div>

      <p className="lead">
        Staff enter and manage their own unavailable times here. Manager
        visibility comes later and is intentionally excluded from this flow.
      </p>

      {errorMessage && (
        <article className="card empty-state" role="alert">
          <h3>Unavailable rules need attention</h3>
          <p className="muted">{errorMessage}</p>
        </article>
      )}

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
        </div>

        {draft.type === "weekly-recurring" && (
          <div className="rule-fields">
            <fieldset className="field fieldset-group field-full">
              <legend>Days of week</legend>
              <div
                aria-describedby={
                  fieldErrors.daysOfWeek
                    ? "unavailability-days-of-week-error"
                    : undefined
                }
                className="checkbox-grid day-checkbox-grid"
              >
                {dayOptions.map((day) => (
                  <label className="checkbox-chip" key={day}>
                    <input
                      checked={draft.daysOfWeek.includes(day)}
                      type="checkbox"
                      onChange={() => handleWeeklyDayToggle(day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
              {renderFieldMessage(
                fieldErrors.daysOfWeek,
                "unavailability-days-of-week-error",
              )}
            </fieldset>

            <div className="form-grid form-grid-compact">
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
            </div>
          </div>
        )}

        {draft.type === "one-time-date" && (
          <div className="rule-fields">
            <div className="form-grid form-grid-compact">
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
            </div>
          </div>
        )}

        {draft.type === "date-range" && (
          <div className="rule-fields">
            <div className="form-grid form-grid-compact">
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
            </div>
          </div>
        )}

        <div className="form-grid">
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
          <button className="primary-button" type="submit" disabled={isSaving}>
            {editingRuleId ? "Save changes" : "Add rule"}
          </button>
          {editingRuleId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <article className="card empty-state" aria-live="polite">
          <h3>Loading unavailable rules</h3>
          <p className="muted">
            Fetching only the selected preview staff member&apos;s unavailable
            times.
          </p>
        </article>
      ) : (
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
                      <h3>{formatUnavailabilityRuleSummary(rule)}</h3>
                      <p className="muted">
                        {rule.note ||
                          "No note added for this unavailable rule."}
                      </p>

                      {deleteCandidateId === rule.id ? (
                        <div className="inline-confirmation" role="alert">
                          <p>Delete this unavailable rule?</p>
                          <div className="card-actions">
                            <button
                              className="ghost-button ghost-button-danger"
                              type="button"
                              onClick={() => void confirmDelete(rule.id)}
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
                <article className="card inset-card empty-state">
                  <h4>No rules yet</h4>
                  <p className="muted">
                    Add unavailable times for this rule type to keep your
                    schedule accurate.
                  </p>
                </article>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
