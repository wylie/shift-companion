import {
  formatDateLabel,
  formatTimeRange,
  parseLocalDateTime,
} from "../lib/date.js";
import { buildScheduleSummary } from "../lib/scheduleSummary.js";
import type { Shift } from "../types";

type Props = {
  errorMessage: string | null;
  isLoading: boolean;
  now: Date;
  shifts: Shift[];
};

function renderLocation(location: string | undefined) {
  return location ? <p className="muted">{location}</p> : null;
}

export function ScheduleSummaryCards({
  errorMessage,
  isLoading,
  now,
  shifts,
}: Props) {
  const { nextShift, todayShifts } = buildScheduleSummary(shifts, now);

  return (
    <div className="schedule-snapshot-grid">
      <article className="card inset-card snapshot-card">
        <p className="eyebrow">Today&apos;s Shifts</p>
        {isLoading ? (
          <p className="muted">Loading schedule...</p>
        ) : errorMessage ? (
          <p className="muted">Unable to load schedule.</p>
        ) : todayShifts.length === 0 ? (
          <p className="muted">No shifts today.</p>
        ) : (
          <div className="summary-shift-stack">
            {todayShifts.map((shift) => {
              const start = parseLocalDateTime(shift.start);
              const end = parseLocalDateTime(shift.end);

              return (
                <div className="summary-shift-item" key={shift.id}>
                  <h3>{shift.title}</h3>
                  <p>{formatTimeRange(start, end)}</p>
                  {renderLocation(shift.location)}
                </div>
              );
            })}
          </div>
        )}
      </article>

      <article className="card inset-card snapshot-card">
        <p className="eyebrow">Next Shift</p>
        {isLoading ? (
          <p className="muted">Loading schedule...</p>
        ) : errorMessage ? (
          <p className="muted">Unable to load schedule.</p>
        ) : nextShift ? (
          <div className="summary-shift-item">
            <h3>{nextShift.title}</h3>
            <p>{formatDateLabel(parseLocalDateTime(nextShift.start))}</p>
            <p>
              {formatTimeRange(
                parseLocalDateTime(nextShift.start),
                parseLocalDateTime(nextShift.end),
              )}
            </p>
            {renderLocation(nextShift.location)}
          </div>
        ) : (
          <p className="muted">No upcoming shifts.</p>
        )}
      </article>
    </div>
  );
}
