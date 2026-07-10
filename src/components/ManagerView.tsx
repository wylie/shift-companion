import { useEffect, useState } from "react";
import { apiClient } from "../data/apiClient";
import { toErrorMessage } from "../lib/errors";
import { canAccessManagerView } from "../lib/access";
import { formatManagerConflictTiming } from "../lib/conflicts";
import { addWeeks, formatWeekRange, startOfWeek } from "../lib/date";
import type { CurrentUser, ManagerReviewData } from "../types";

type Props = {
  currentUser: CurrentUser;
};

const today = new Date();

export function ManagerView({ currentUser }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [reviewData, setReviewData] = useState<ManagerReviewData | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingReview, setIsLoggingReview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadReviewData() {
      if (!canAccessManagerView(currentUser)) {
        setReviewData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextReviewData = await apiClient.getManagerReview(
          currentUser.id,
          {
            departmentId: selectedDepartmentId || undefined,
            weekStart: weekStart.toISOString().slice(0, 10),
          },
        );

        if (isCancelled) {
          return;
        }

        setReviewData(nextReviewData);

        if (
          nextReviewData.selectedDepartment &&
          nextReviewData.selectedDepartment.id !== selectedDepartmentId
        ) {
          setSelectedDepartmentId(nextReviewData.selectedDepartment.id);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            toErrorMessage(error, "Unable to load manager review data."),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReviewData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, selectedDepartmentId, weekStart]);

  const departmentOptions = reviewData?.managedDepartments ?? [];
  const selectedDepartment = reviewData?.selectedDepartment ?? null;

  if (!canAccessManagerView(currentUser)) {
    return (
      <section className="screen">
        <div className="section-header">
          <div>
            <p className="eyebrow">Manager View</p>
            <h2>Restricted</h2>
          </div>
          <span className="pill">Manager only</span>
        </div>
        <p className="lead">
          Staff cannot access manager review tooling. The server also scopes
          manager data to assigned departments only.
        </p>
      </section>
    );
  }

  if (!isLoading && !selectedDepartment) {
    return (
      <section className="screen">
        <div className="section-header">
          <div>
            <p className="eyebrow">Manager View</p>
            <h2>No assigned departments</h2>
          </div>
          <span className="pill">Read-only</span>
        </div>
        <p className="lead">
          No persisted demo departments are assigned to this manager profile
          yet.
        </p>
      </section>
    );
  }

  async function handleLogReview() {
    if (!selectedDepartment) {
      return;
    }

    setIsLoggingReview(true);
    setReviewMessage(null);
    setErrorMessage(null);

    try {
      await apiClient.logManagerReview(currentUser.id, {
        departmentId: selectedDepartment.id,
        weekStart: weekStart.toISOString().slice(0, 10),
      });
      setReviewMessage("Review logged to the demo audit trail.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error, "Unable to log review."));
    } finally {
      setIsLoggingReview(false);
    }
  }

  function goToPreviousWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, -1));
    setReviewMessage(null);
  }

  function goToNextWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, 1));
    setReviewMessage(null);
  }

  function goToThisWeek() {
    setWeekStart(startOfWeek(today));
    setReviewMessage(null);
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Manager View</p>
          <h2>Department conflict review</h2>
        </div>
        <span className="pill">Read-only review</span>
      </div>

      <p className="lead">
        Review conflicts before publishing the Teams Shifts schedule. This
        manager tooling remains read-only and is scoped to the selected preview
        manager&apos;s assigned departments.
      </p>

      {errorMessage && (
        <article className="card empty-state" role="alert">
          <h3>Manager review needs attention</h3>
          <p className="muted">{errorMessage}</p>
        </article>
      )}

      <div className="card manager-controls">
        <label className="field">
          Department
          <select
            className="select-control"
            disabled={departmentOptions.length <= 1}
            aria-disabled={departmentOptions.length <= 1}
            value={selectedDepartment?.id ?? ""}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
          >
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {departmentOptions.length <= 1 && (
            <span className="field-help">
              This persisted demo manager identity is assigned to one
              department.
            </span>
          )}
        </label>

        <div
          className="schedule-toolbar schedule-toolbar-inline"
          role="group"
          aria-label="Manager review week navigation"
        >
          <div>
            <h3>{formatWeekRange(weekStart)}</h3>
            <p className="muted">
              Compare persisted demo shifts against persisted unavailable rules
              for {selectedDepartment?.name ?? "this department"}.
            </p>
          </div>

          <div className="toolbar-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={goToPreviousWeek}
            >
              Previous week
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={goToThisWeek}
            >
              This week
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={goToNextWeek}
            >
              Next week
            </button>
          </div>
        </div>
      </div>

      {reviewMessage && (
        <article className="card empty-state" role="status">
          <p className="success-message">{reviewMessage}</p>
        </article>
      )}

      {isLoading || !reviewData ? (
        <article className="card empty-state" aria-live="polite">
          <h3>Loading manager review</h3>
          <p className="muted">
            Fetching only the selected manager&apos;s assigned department data.
          </p>
        </article>
      ) : (
        <>
          <div className="card-grid summary-grid">
            <article className="card inset-card">
              <h3>{reviewData.reviewedShiftCount}</h3>
              <p className="muted">Shifts reviewed</p>
            </article>
            <article className="card inset-card">
              <h3>{reviewData.conflictCount}</h3>
              <p className="muted">Conflicts found</p>
            </article>
            <article className="card inset-card">
              <h3>{reviewData.staffWithConflictsCount}</h3>
              <p className="muted">Staff with conflicts</p>
            </article>
          </div>

          <div className="manager-layout">
            <section className="card manager-panel">
              <div className="group-header">
                <h3>Conflict review</h3>
                <span className="muted">{selectedDepartment?.name}</span>
              </div>

              {reviewData.conflicts.length > 0 ? (
                <div className="manager-conflicts">
                  {reviewData.conflicts.map((conflict) => (
                    <article className="card inset-card" key={conflict.id}>
                      <div className="group-header">
                        <h4>{conflict.staff.name}</h4>
                        <span className="severity severity-high">Conflict</span>
                      </div>
                      <p>{conflict.shift.title}</p>
                      <p className="muted">
                        {formatManagerConflictTiming(conflict.shift)}
                      </p>
                      <p className="muted">{conflict.shift.location}</p>
                      <p>
                        Conflicting unavailable rule:{" "}
                        <strong>{conflict.ruleSummary}</strong>
                      </p>
                      {conflict.rule.note && (
                        <p className="muted">Note: {conflict.rule.note}</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <article className="card inset-card empty-state">
                  <h4>No conflicts this week</h4>
                  <p className="muted">
                    This department has no detected conflicts in the displayed
                    week.
                  </p>
                </article>
              )}
            </section>

            <section className="card manager-panel">
              <div className="group-header">
                <h3>Department staff</h3>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={isLoggingReview || !selectedDepartment}
                  onClick={() => void handleLogReview()}
                >
                  Log review
                </button>
              </div>

              <p className="muted">
                Review conflicts before publishing the Teams Shifts schedule.
              </p>

              <div className="staff-list">
                {reviewData.staffSummaries.map((summary) => (
                  <article className="staff-row" key={summary.staffMember.id}>
                    <div>
                      <h4>{summary.staffMember.name}</h4>
                    </div>
                    <div className="staff-stats">
                      <p>{summary.unavailableRuleCount} unavailable rules</p>
                      <p className="muted">
                        {summary.staffConflictCount} conflicts this week
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
