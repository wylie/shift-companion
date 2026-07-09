import { useState } from "react";
import { apiClient } from "../data/apiClient";
import {
  addDays,
  addWeeks,
  formatDateLabel,
  formatWeekRange,
  startOfWeek,
} from "../lib/date";
import { toErrorMessage } from "../lib/errors";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

type CalendarWindow = 1 | 4;

const today = new Date("2026-06-24T12:00:00");

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function CalendarExport({ currentUser }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [weeks, setWeeks] = useState<CalendarWindow>(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleRangeEnd = addWeeks(weekStart, weeks);
  const exportRangeEnd = addDays(visibleRangeEnd, -1);

  async function handleDownloadCalendar() {
    try {
      setIsDownloading(true);
      setErrorMessage(null);
      setDownloadMessage(null);

      const blob = await apiClient.downloadCalendar(
        currentUser.id,
        weekStart.toISOString().slice(0, 10),
        weeks,
      );

      downloadBlob("my-shifts.ics", blob);
      setDownloadMessage(
        `Downloaded my-shifts.ics for ${formatDateLabel(
          weekStart,
        )} through ${formatDateLabel(exportRangeEnd)}.`,
      );
    } catch (error) {
      setErrorMessage(toErrorMessage(error, "Calendar download failed."));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Take your Teams Shifts schedule with you</h2>
        </div>
        <span className="pill">Export today, subscribe later</span>
      </div>

      <p className="lead">
        Keep your work schedule available in Apple Calendar, Google Calendar,
        or Outlook. Export a one-time `.ics` file now, with personal calendar
        subscriptions planned for a future release.
      </p>

      <section className="card hero-panel">
        <div>
          <h3>Choose your calendar window</h3>
          <p className="muted">
            Export only your shifts for the selected date range. Automatic
            synchronization is planned, but not enabled in this MVP.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className={`toggle-button ${weeks === 1 ? "active" : ""}`}
            type="button"
            onClick={() => setWeeks(1)}
          >
            1 week
          </button>
          <button
            className={`toggle-button ${weeks === 4 ? "active" : ""}`}
            type="button"
            onClick={() => setWeeks(4)}
          >
            4 weeks
          </button>
        </div>

        <div className="toolbar-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setWeekStart((current) => addWeeks(current, -1))}
          >
            Previous week
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setWeekStart(startOfWeek(today))}
          >
            This week
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setWeekStart((current) => addWeeks(current, 1))}
          >
            Next week
          </button>
        </div>
      </section>

      <section className="card calendar-section">
        <div className="group-header">
          <h3>{formatWeekRange(weekStart)}</h3>
          <span className="muted">
            {formatDateLabel(weekStart)} through {formatDateLabel(exportRangeEnd)}
          </span>
        </div>

        <p className="muted">
          The exported file contains only your schedule for the selected{" "}
          {weeks === 1 ? "week" : "four-week"} window.
        </p>

        <div className="calendar-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isDownloading}
            onClick={() => void handleDownloadCalendar()}
          >
            {isDownloading ? "Preparing calendar..." : "Download calendar (.ics)"}
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled
            aria-disabled="true"
          >
            Subscribe to calendar - planned
          </button>
        </div>

        {downloadMessage && (
          <p className="success-message" role="status">
            {downloadMessage}
          </p>
        )}

        {errorMessage && (
          <article className="card inset-card empty-state" role="alert">
            <h4>Calendar export needs attention</h4>
            <p className="muted">{errorMessage}</p>
          </article>
        )}

        <div className="privacy-grid">
          <article className="card inset-card">
            <h4>Apple Calendar</h4>
            <p className="muted">
              Import the `.ics` file now. Subscription support is planned.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Google Calendar</h4>
            <p className="muted">
              Use the exported file today, with personal subscription links
              coming later.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Outlook</h4>
            <p className="muted">
              Keep Teams Shifts visible alongside the rest of your workday.
            </p>
          </article>
        </div>

        <ul className="privacy-list">
          <li>Your export includes only your own shifts.</li>
          <li>Future subscriptions should be private and revocable.</li>
          <li>Automatic synchronization is planned, not live yet.</li>
        </ul>
      </section>
    </section>
  );
}
