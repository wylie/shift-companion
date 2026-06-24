import { useEffect, useMemo, useState } from "react";
import {
  shifts,
  staffMembers,
  teams,
  unavailabilityRules,
} from "../data/mockData";
import { canAccessManagerView, getManagedDepartments } from "../lib/access";
import {
  detectManagerConflicts,
  formatManagerConflictTiming,
} from "../lib/conflicts";
import {
  addDays,
  addWeeks,
  formatWeekRange,
  isWithinRange,
  parseLocalDateTime,
  startOfWeek,
} from "../lib/date";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

const today = new Date("2026-06-24T12:00:00");

export function ManagerView({ currentUser }: Props) {
  const managedDepartments = useMemo(
    () => getManagedDepartments(currentUser, teams),
    [currentUser],
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    managedDepartments[0]?.id ?? "",
  );
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  useEffect(() => {
    if (!managedDepartments.some((team) => team.id === selectedDepartmentId)) {
      setSelectedDepartmentId(managedDepartments[0]?.id ?? "");
    }
  }, [managedDepartments, selectedDepartmentId]);

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
          Staff cannot access manager review tooling. Future server-side
          authorization must enforce this as well.
        </p>
      </section>
    );
  }

  const selectedDepartment =
    managedDepartments.find((team) => team.id === selectedDepartmentId) ??
    managedDepartments[0];

  if (!selectedDepartment) {
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
          No mocked departments are assigned to this manager profile yet.
        </p>
      </section>
    );
  }

  const weekEnd = addDays(weekStart, 7);
  const reviewedShifts = shifts
    .filter(
      (shift) =>
        shift.department === selectedDepartment.name &&
        isWithinRange(parseLocalDateTime(shift.start), weekStart, weekEnd),
    )
    .slice()
    .sort((left, right) => left.start.localeCompare(right.start));

  const conflicts = detectManagerConflicts({
    departmentId: selectedDepartment.id,
    shifts,
    staffMembers,
    teams,
    unavailabilityRules,
    weekStart,
    weekEnd,
  });

  const departmentStaff = staffMembers.filter(
    (staffMember) => staffMember.teamId === selectedDepartment.id,
  );
  const staffSummaries = departmentStaff.map((staffMember) => {
    const unavailableRuleCount = unavailabilityRules.filter(
      (rule) => rule.userId === staffMember.id,
    ).length;
    const staffConflictCount = conflicts.filter(
      (conflict) => conflict.staff.id === staffMember.id,
    ).length;

    return {
      staffMember,
      unavailableRuleCount,
      staffConflictCount,
    };
  });

  const staffWithConflictsCount = new Set(
    conflicts.map((conflict) => conflict.staff.id),
  ).size;

  function goToPreviousWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, -1));
  }

  function goToNextWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, 1));
  }

  function goToThisWeek() {
    setWeekStart(startOfWeek(today));
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
        manager tooling is mocked, local-only, and read-only for now.
      </p>

      <div className="card manager-controls">
        <label className="field">
          Department
          <select
            className="select-control"
            disabled={managedDepartments.length <= 1}
            aria-disabled={managedDepartments.length <= 1}
            value={selectedDepartment.id}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
          >
            {managedDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {managedDepartments.length <= 1 && (
            <span className="field-help">
              This mocked manager identity is assigned to one department.
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
              Compare mocked shifts against mocked staff unavailable rules for{" "}
              {selectedDepartment.name}.
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

      <div className="card-grid summary-grid">
        <article className="card inset-card">
          <h3>{reviewedShifts.length}</h3>
          <p className="muted">Shifts reviewed</p>
        </article>
        <article className="card inset-card">
          <h3>{conflicts.length}</h3>
          <p className="muted">Conflicts found</p>
        </article>
        <article className="card inset-card">
          <h3>{staffWithConflictsCount}</h3>
          <p className="muted">Staff with conflicts</p>
        </article>
      </div>

      <div className="manager-layout">
        <section className="card manager-panel">
          <div className="group-header">
            <h3>Conflict review</h3>
            <span className="muted">{selectedDepartment.name}</span>
          </div>

          {conflicts.length > 0 ? (
            <div className="manager-conflicts">
              {conflicts.map((conflict) => (
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
              <h4>No conflicts found</h4>
              <p className="muted">
                This department has no mocked scheduling conflicts for the
                selected week.
              </p>
            </article>
          )}
        </section>

        <section className="card manager-panel">
          <div className="group-header">
            <h3>Department staff</h3>
            <span className="muted">{staffSummaries.length} staff</span>
          </div>

          <div className="staff-list">
            {staffSummaries.map(
              ({ staffMember, unavailableRuleCount, staffConflictCount }) => (
                <article className="staff-row" key={staffMember.id}>
                  <div>
                    <h4>{staffMember.name}</h4>
                    <p className="muted">{selectedDepartment.name}</p>
                  </div>
                  <div className="staff-stats">
                    <p>{unavailableRuleCount} unavailable rules</p>
                    <p className="muted">
                      {staffConflictCount} conflicts this week
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
