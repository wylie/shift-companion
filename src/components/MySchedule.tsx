import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../data/apiClient";
import { toErrorMessage } from "../lib/errors";
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
import type { CurrentUser, NavItem, Shift } from "../types";

type Props = {
  currentUser: CurrentUser;
  onNavigate: (view: Extract<NavItem["id"], "calendar" | "feedback" | "settings">) => void;
};

type ScheduleViewMode = "week" | "four-week";

const today = new Date("2026-06-24T12:00:00");
const weekdayCount = 7;

function getShiftCountLabel(count: number): string {
  return `${count} ${count === 1 ? "shift" : "shifts"}`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function MySchedule({ currentUser, onNavigate }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSchedule() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextShifts = await apiClient.getMySchedule(currentUser.id);

        if (!isCancelled) {
          setMyShifts(
            nextShifts
              .slice()
              .sort((left, right) => left.start.localeCompare(right.start)),
          );
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(toErrorMessage(error, "Unable to load shifts."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => {
      isCancelled = true;
    };
  }, [currentUser.id]);

  const visibleWeekCount = viewMode === "four-week" ? 4 : 1;
  const visibleRangeEnd = addWeeks(weekStart, visibleWeekCount);
  const visibleShifts = useMemo(
    () =>
      myShifts.filter((shift) =>
        isWithinRange(
          parseLocalDateTime(shift.start),
          weekStart,
          visibleRangeEnd,
        ),
      ),
    [myShifts, visibleRangeEnd, weekStart],
  );

  const scheduleWeeks = useMemo(
    () =>
      Array.from({ length: visibleWeekCount }, (_, weekIndex) => {
        const currentWeekStart = addWeeks(weekStart, weekIndex);
        const days = Array.from({ length: weekdayCount }, (_, dayIndex) => {
          const day = addDays(currentWeekStart, dayIndex);
          const dayShifts = visibleShifts.filter((shift) =>
            isSameDay(parseLocalDateTime(shift.start), day),
          );

          return {
            date: day,
            shifts: dayShifts,
          };
        });

        return {
          weekStart: currentWeekStart,
          days,
        };
      }),
    [visibleShifts, visibleWeekCount, weekStart],
  );

  const exportRangeStart = weekStart;
  const exportRangeEnd = addDays(visibleRangeEnd, -1);
  const todayShifts = useMemo(
    () =>
      myShifts.filter((shift) =>
        isSameDay(parseLocalDateTime(shift.start), today),
      ),
    [myShifts],
  );
  const nextShift = useMemo(
    () =>
      myShifts.find((shift) => parseLocalDateTime(shift.start).getTime() >= today.getTime()) ??
      null,
    [myShifts],
  );
  const thisWeekShiftCount = useMemo(
    () =>
      myShifts.filter((shift) =>
        isWithinRange(
          parseLocalDateTime(shift.start),
          startOfWeek(today),
          addWeeks(startOfWeek(today), 1),
        ),
      ).length,
    [myShifts],
  );
  const thisWeekDayCount = useMemo(
    () =>
      myShifts.reduce((dayKeys, shift) => {
        const date = parseLocalDateTime(shift.start);
        if (
          isWithinRange(date, startOfWeek(today), addWeeks(startOfWeek(today), 1))
        ) {
          dayKeys.add(date.toISOString().slice(0, 10));
        }

        return dayKeys;
      }, new Set<string>()).size,
    [myShifts],
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

  async function handleDownloadCalendar() {
    try {
      setIsDownloadingCalendar(true);
      setErrorMessage(null);
      setDownloadMessage(null);
      const blob = await apiClient.downloadCalendar(
        currentUser.id,
        weekStart.toISOString().slice(0, 10),
        visibleWeekCount,
      );
      downloadBlob("my-shifts.ics", blob);
      setDownloadMessage(
        `Downloaded my-shifts.ics with your shifts from ${formatDateLabel(
          exportRangeStart,
        )} through ${formatDateLabel(exportRangeEnd)}.`,
      );
    } catch (error) {
      setErrorMessage(toErrorMessage(error, "Calendar download failed."));
    } finally {
      setIsDownloadingCalendar(false);
    }
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Schedule</p>
          <h2>Take your Teams Shifts schedule with you</h2>
        </div>
        <span className="pill">My Schedule first</span>
      </div>

      <p className="lead">
        Review only your own shifts, then move them into the calendar
        application you already use. Export is available now, and automatic
        synchronization is planned for a future release.
      </p>

      <section className="card hero-panel">
        <div>
          <h3>What am I working?</h3>
          <p className="muted">
            This companion is built to make Teams Shifts more useful, not to
            replace it. Check today, see what is next, and take your Teams
            Shifts schedule with you.
          </p>
        </div>

        <div className="schedule-snapshot-grid">
          <article className="card inset-card snapshot-card">
            <p className="eyebrow">Today&apos;s Shifts</p>
            <h3>{todayShifts.length === 0 ? "Off today" : getShiftCountLabel(todayShifts.length)}</h3>
            <p className="muted">
              {todayShifts.length > 0
                ? todayShifts
                    .map((shift) =>
                      formatTimeRange(
                        parseLocalDateTime(shift.start),
                        parseLocalDateTime(shift.end),
                      ),
                    )
                    .join(" • ")
                : "No shifts are scheduled in today’s preview window."}
            </p>
          </article>
          <article className="card inset-card snapshot-card">
            <p className="eyebrow">Next Shift</p>
            <h3>{nextShift ? nextShift.title : "Nothing upcoming yet"}</h3>
            <p className="muted">
              {nextShift
                ? `${formatDateLabel(parseLocalDateTime(nextShift.start))} • ${formatTimeRange(
                    parseLocalDateTime(nextShift.start),
                    parseLocalDateTime(nextShift.end),
                  )}`
                : "Check back later for your next published Teams Shifts assignment."}
            </p>
          </article>
          <article className="card inset-card snapshot-card">
            <p className="eyebrow">This Week</p>
            <h3>{getShiftCountLabel(thisWeekShiftCount)}</h3>
            <p className="muted">
              {thisWeekShiftCount > 0
                ? `${thisWeekDayCount} scheduled day${thisWeekDayCount === 1 ? "" : "s"} in the current preview week.`
                : "This preview week is currently clear."}
            </p>
          </article>
        </div>

        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={goToThisWeek}
          >
            View My Schedule
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onNavigate("calendar")}
          >
            Open Calendar
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={isDownloadingCalendar}
            onClick={() => void handleDownloadCalendar()}
          >
            {isDownloadingCalendar
              ? "Preparing calendar..."
              : "Download Calendar (.ics)"}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onNavigate("feedback")}
          >
            Feedback
          </button>
        </div>
      </section>

      {errorMessage && (
        <article className="card empty-state" role="alert">
          <h3>Schedule needs attention</h3>
          <p className="muted">{errorMessage}</p>
        </article>
      )}

      <div
        className="card schedule-toolbar"
        role="group"
        aria-label="Schedule controls"
      >
        <div>
          <h3>{formatWeekRange(weekStart)}</h3>
          <p className="muted">
            {viewMode === "week"
              ? "Use week controls to review today, upcoming shifts, and the rest of your week."
              : `Showing four consecutive weeks from ${formatDateLabel(
                  weekStart,
                )} through ${formatDateLabel(exportRangeEnd)}.`}
          </p>
        </div>

        <div className="toolbar-side">
          <div className="view-toggle" role="group" aria-label="Schedule view">
            <button
              className={`toggle-button ${
                viewMode === "week" ? "active" : ""
              }`}
              type="button"
              onClick={() => setViewMode("week")}
              aria-pressed={viewMode === "week"}
            >
              Week view
            </button>
            <button
              className={`toggle-button ${
                viewMode === "four-week" ? "active" : ""
              }`}
              type="button"
              onClick={() => setViewMode("four-week")}
              aria-pressed={viewMode === "four-week"}
            >
              4-week view
            </button>
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

      {isLoading ? (
        <article className="card empty-state" aria-live="polite">
          <h3>Loading your schedule</h3>
          <p className="muted">
            Fetching only the selected preview staff member&apos;s persisted
            demo shifts.
          </p>
        </article>
      ) : visibleShifts.length > 0 ? (
        <div className="schedule-weeks-stack">
          {scheduleWeeks.map((scheduleWeek, index) => (
            <section className="schedule-week-block" key={scheduleWeek.weekStart.toISOString()}>
              {viewMode === "four-week" && (
                <div className="week-block-header">
                  <h3>{formatWeekRange(scheduleWeek.weekStart)}</h3>
                  <p className="muted">
                    Week {index + 1} of 4 in your current planning window.
                  </p>
                </div>
              )}

              <div className="schedule-week">
                {scheduleWeek.days.map(({ date, shifts: dayShifts }) => (
                  <section className="card day-column" key={date.toISOString()}>
                    <div className="day-column-header">
                      <h3
                        aria-label={formatDayLabel(date)}
                        className="day-column-title"
                        title={formatDayLabel(date)}
                      >
                        {formatShortDayLabel(date)}
                      </h3>
                      <span className="muted day-column-count">
                        {getShiftCountLabel(dayShifts.length)}
                      </span>
                    </div>

                    {dayShifts.length > 0 ? (
                      <div className="day-column-shifts">
                        {dayShifts.map((shift) => (
                          <article className="shift-card" key={shift.id}>
                            <div className="shift-card-header">
                              <h4>{shift.title}</h4>
                              <span className="shift-time-pill">
                                {formatTimeRange(
                                  parseLocalDateTime(shift.start),
                                  parseLocalDateTime(shift.end),
                                )}
                              </span>
                            </div>
                            <p className="muted">
                              {formatDateLabel(parseLocalDateTime(shift.start))}
                            </p>
                            <p className="shift-primary-line">
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
            </section>
          ))}
        </div>
      ) : (
        <article className="card empty-state">
          <h3>
            {viewMode === "week"
              ? "No shifts scheduled for this week"
              : "No shifts scheduled for these four weeks"}
          </h3>
          <p className="muted">
            {viewMode === "week"
              ? "Try another week, or return to This week to check your current preview schedule."
              : "Try another starting week, or return to This week to check your current four-week preview schedule."}
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
          Download calendar (.ics) is available now as a one-time server-backed
          file. Each download includes only your shifts for the currently
          displayed {viewMode === "week" ? "week" : "4-week"} window:
          {" "}
          {formatDateLabel(exportRangeStart)} through{" "}
          {formatDateLabel(exportRangeEnd)}.
        </p>

        <div className="calendar-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isDownloadingCalendar}
            onClick={() => void handleDownloadCalendar()}
          >
            {isDownloadingCalendar
              ? "Preparing calendar..."
              : "Download calendar (.ics)"}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onNavigate("calendar")}
          >
            Open Calendar
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
            <h4>Stay in sync</h4>
            <p className="muted">
              Calendar subscriptions will arrive later as a private, personal
              sync option.
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
