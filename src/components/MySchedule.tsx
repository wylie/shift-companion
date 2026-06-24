import { useMemo, useState } from "react";
import { appRepositories } from "../data/repositories";
import { buildCalendarIcs } from "../lib/calendar";
import {
  addDays,
  addWeeks,
  formatDateLabel,
  formatDayLabel,
  formatShortDayLabel,
  formatTimeRange,
  formatWeekRange,
  isSameDay,
  isWithinRange,
  parseLocalDateTime,
  startOfWeek,
} from "../lib/date";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

const today = new Date("2026-06-24T12:00:00");

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function MySchedule({ currentUser }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const myShifts = useMemo(
    () =>
      appRepositories.shifts
        .listForUser(currentUser.id)
        .slice()
        .sort((left, right) => left.start.localeCompare(right.start)),
    [currentUser.id],
  );

  const weekEnd = addDays(weekStart, 7);
  const visibleShifts = myShifts.filter((shift) =>
    isWithinRange(parseLocalDateTime(shift.start), weekStart, weekEnd),
  );

  const scheduleDays = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const dayShifts = visibleShifts.filter((shift) =>
      isSameDay(parseLocalDateTime(shift.start), day),
    );

    return {
      date: day,
      shifts: dayShifts,
    };
  });

  const exportRangeStart = addWeeks(weekStart, -1);
  const exportRangeEnd = addWeeks(weekStart, 2);
  const exportableShifts = myShifts.filter((shift) =>
    isWithinRange(
      parseLocalDateTime(shift.start),
      exportRangeStart,
      exportRangeEnd,
    ),
  );

  function goToPreviousWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, -1));
    setDownloadMessage(null);
  }

  function goToNextWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, 1));
    setDownloadMessage(null);
  }

  function goToThisWeek() {
    setWeekStart(startOfWeek(today));
    setDownloadMessage(null);
  }

  function handleDownloadCalendar() {
    const ics = buildCalendarIcs(exportableShifts);
    downloadFile("my-shifts.ics", ics, "text/calendar;charset=utf-8");
    setDownloadMessage(
      `Downloaded my-shifts.ics with ${exportableShifts.length} shifts from ${formatDateLabel(
        exportRangeStart,
      )} through ${formatDateLabel(addDays(exportRangeEnd, -1))}.`,
    );
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Schedule</p>
          <h2>Weekly schedule</h2>
        </div>
        <span className="pill">Local calendar export</span>
      </div>

      <p className="lead">
        View only your own mocked shifts here. The schedule stays browser-only
        for now, and calendar download exports just your shifts.
      </p>

      <div
        className="card schedule-toolbar"
        role="group"
        aria-label="Week navigation"
      >
        <div>
          <h3>{formatWeekRange(weekStart)}</h3>
          <p className="muted">
            Use week controls to review past and upcoming shifts.
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
          <button className="ghost-button" type="button" onClick={goToThisWeek}>
            This week
          </button>
          <button className="ghost-button" type="button" onClick={goToNextWeek}>
            Next week
          </button>
        </div>
      </div>

      {visibleShifts.length > 0 ? (
        <div className="schedule-week">
          {scheduleDays.map(({ date, shifts: dayShifts }) => (
            <section className="card day-column" key={date.toISOString()}>
              <div className="day-column-header">
                <h3
                  aria-label={formatDayLabel(date)}
                  className="day-column-title"
                  title={formatDayLabel(date)}
                >
                  {formatShortDayLabel(date)}
                </h3>
                <span className="muted">{dayShifts.length} shifts</span>
              </div>

              {dayShifts.length > 0 ? (
                <div className="day-column-shifts">
                  {dayShifts.map((shift) => (
                    <article className="shift-card" key={shift.id}>
                      <h4>{shift.title}</h4>
                      <p className="muted">
                        {formatDateLabel(parseLocalDateTime(shift.start))}
                      </p>
                      <p>
                        {formatTimeRange(
                          parseLocalDateTime(shift.start),
                          parseLocalDateTime(shift.end),
                        )}
                      </p>
                      {shift.department && (
                        <p className="muted">{shift.department}</p>
                      )}
                      <p className="muted">{shift.location}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <article className="day-empty-state">
                  <p className="muted">No shifts scheduled.</p>
                </article>
              )}
            </section>
          ))}
        </div>
      ) : (
        <article className="card empty-state">
          <h3>No shifts scheduled for this week</h3>
          <p className="muted">
            Try another week, or return to This week to review the current
            mocked schedule window.
          </p>
        </article>
      )}

      <section className="card calendar-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Calendar & Privacy</p>
            <h3>Personal schedule export</h3>
          </div>
        </div>

        <p className="muted">
          Download calendar (.ics) is available now as a one-time file. Each
          download includes only your shifts from the displayed week, plus one
          week before and one week after for a useful import window.
        </p>

        <div className="calendar-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleDownloadCalendar}
          >
            Download calendar (.ics)
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled
            aria-disabled="true"
          >
            Private calendar subscription - coming later
          </button>
        </div>

        {downloadMessage && (
          <p className="success-message" role="status">
            {downloadMessage}
          </p>
        )}

        <div className="privacy-grid">
          <article className="card inset-card">
            <h4>Download calendar (.ics)</h4>
            <p className="muted">
              Creates a one-time file you can import into another calendar.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Subscribe to calendar</h4>
            <p className="muted">
              Future feature that would update automatically using a private
              personal link.
            </p>
          </article>
        </div>

        <ul className="privacy-list">
          <li>
            A future subscription would be individual-only and include only your
            shifts.
          </li>
          <li>
            It would be revocable or regenerable if access ever needs to be
            replaced.
          </li>
          <li>It should not be shared with other people.</li>
          <li>
            Apple Calendar and Google Calendar subscriptions live outside Teams
            and may receive your shift event data.
          </li>
        </ul>
      </section>
    </section>
  );
}
