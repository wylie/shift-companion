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
import { ScheduleSummaryCards } from "./ScheduleSummaryCards.js";
import type { CurrentUser, Shift } from "../types";

type Props = {
  currentUser: CurrentUser;
};

type ScheduleViewMode = "week" | "four-week";

const weekdayCount = 7;

function getShiftCountLabel(count: number): string {
  return `${count} ${count === 1 ? "shift" : "shifts"}`;
}

export function MySchedule({ currentUser }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadSchedule() {
      setIsLoading(true);
      setErrorMessage(null);
      setMyShifts([]);

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
  function goToPreviousWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, -1));
  }

  function goToNextWeek() {
    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, 1));
  }

  function goToThisWeek() {
    setWeekStart(startOfWeek(now));
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Schedule &amp; Calendar</p>
          <h2>Schedule</h2>
        </div>
      </div>

      <section className="card hero-panel">
        <ScheduleSummaryCards
          errorMessage={errorMessage}
          isLoading={isLoading}
          now={now}
          shifts={myShifts}
        />
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
        <h3>{formatWeekRange(weekStart)}</h3>

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
          <p className="muted">Loading shifts.</p>
        </article>
      ) : visibleShifts.length > 0 ? (
        <div className="schedule-weeks-stack">
          {scheduleWeeks.map((scheduleWeek, index) => (
            <section className="schedule-week-block" key={scheduleWeek.weekStart.toISOString()}>
              {viewMode === "four-week" && (
                <div className="week-block-header">
                  <h3>{formatWeekRange(scheduleWeek.weekStart)}</h3>
                  <p className="muted">Week {index + 1} of 4</p>
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
          <p className="muted">Try another week.</p>
        </article>
      )}
    </section>
  );
}
