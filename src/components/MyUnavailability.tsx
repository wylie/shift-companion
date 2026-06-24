import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { unavailabilityRules } from "../data/mockData";
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

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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

const groupedRuleTypes: Array<{
  type: UnavailabilityRuleType;
  label: string;
}> = [
  { type: "weekly-recurring", label: "Weekly recurring" },
  { type: "one-time-date", label: "One-time date" },
  { type: "date-range", label: "Date range" },
];

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

function formatRuleSummary(rule: UnavailabilityRule): string {
  if (rule.type === "weekly-recurring") {
    return `${rule.dayOfWeek} • ${rule.startTime} - ${rule.endTime}`;
  }

  if (rule.type === "one-time-date") {
    return `${rule.date} • ${rule.startTime} - ${rule.endTime}`;
  }

  return `${rule.startDate} to ${rule.endDate}`;
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

function validateDraft(draft: RuleDraft): string | null {
  if (draft.type === "weekly-recurring") {
    if (!draft.dayOfWeek || !draft.startTime || !draft.endTime) {
      return "Weekly recurring rules need a day, start time, and end time.";
    }

    if (draft.endTime <= draft.startTime) {
      return "End time must be after start time.";
    }
  }

  if (draft.type === "one-time-date") {
    if (!draft.date || !draft.startTime || !draft.endTime) {
      return "One-time dates need a date, start time, and end time.";
    }

    if (draft.endTime <= draft.startTime) {
      return "End time must be after start time.";
    }
  }

  if (draft.type === "date-range") {
    if (!draft.startDate || !draft.endDate) {
      return "Date ranges need a start date and end date.";
    }

    if (draft.endDate < draft.startDate) {
      return "End date must be on or after the start date.";
    }
  }

  return null;
}

export function MyUnavailability({ currentUser }: Props) {
  const [rules, setRules] = useState(() =>
    // Future persistence should load only the signed-in staff member's rules.
    unavailabilityRules.filter((rule) => rule.userId === currentUser.id),
  );
  const [draft, setDraft] = useState<RuleDraft>(emptyDraft);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Future persistence and user filtering should refresh rules for the active user.
    setRules(
      unavailabilityRules.filter((rule) => rule.userId === currentUser.id),
    );
    setDraft(emptyDraft);
    setEditingRuleId(null);
    setErrorMessage(null);
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
    setErrorMessage(null);
  }

  function handleDraftChange<Key extends keyof RuleDraft>(
    key: Key,
    value: RuleDraft[Key],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateDraft(draft);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const nextRule = buildRuleFromDraft(
      draft,
      currentUser.id,
      editingRuleId ?? undefined,
    );

    setRules((currentRules) => {
      if (editingRuleId) {
        return currentRules.map((rule) =>
          rule.id === editingRuleId ? nextRule : rule,
        );
      }

      // Future persistence should write user-scoped rule changes to the backend.
      return [...currentRules, nextRule];
    });

    resetForm();
  }

  function handleEdit(rule: UnavailabilityRule) {
    setDraft(createDraftFromRule(rule));
    setEditingRuleId(rule.id);
    setErrorMessage(null);
  }

  function handleDelete(ruleId: string) {
    setRules((currentRules) =>
      currentRules.filter((rule) => rule.id !== ruleId),
    );

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

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <h3>
              {editingRuleId ? "Edit unavailable rule" : "Add unavailable rule"}
            </h3>
            <p className="muted">
              Mocked only for now. No database, Teams SSO, or Microsoft Graph is
              connected yet.
            </p>
          </div>
          {editingRuleId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <div className="form-grid">
          <label className="field">
            Rule type
            <select
              value={draft.type}
              onChange={(event) =>
                handleDraftChange(
                  "type",
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
          </label>

          {draft.type === "weekly-recurring" && (
            <>
              <label className="field">
                Day of week
                <select
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
              </label>
              <label className="field">
                Start time
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(event) =>
                    handleDraftChange("startTime", event.target.value)
                  }
                />
              </label>
              <label className="field">
                End time
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(event) =>
                    handleDraftChange("endTime", event.target.value)
                  }
                />
              </label>
            </>
          )}

          {draft.type === "one-time-date" && (
            <>
              <label className="field">
                Date
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    handleDraftChange("date", event.target.value)
                  }
                />
              </label>
              <label className="field">
                Start time
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(event) =>
                    handleDraftChange("startTime", event.target.value)
                  }
                />
              </label>
              <label className="field">
                End time
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(event) =>
                    handleDraftChange("endTime", event.target.value)
                  }
                />
              </label>
            </>
          )}

          {draft.type === "date-range" && (
            <>
              <label className="field">
                Start date
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    handleDraftChange("startDate", event.target.value)
                  }
                />
              </label>
              <label className="field">
                End date
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    handleDraftChange("endDate", event.target.value)
                  }
                />
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
          </label>
        </div>

        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="form-actions">
          <button className="primary-button" type="submit">
            {editingRuleId ? "Save changes" : "Add rule"}
          </button>
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
                        onClick={() => handleDelete(rule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <article className="card">
                <p className="muted">
                  No {group.label.toLowerCase()} unavailable rules yet.
                </p>
              </article>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
