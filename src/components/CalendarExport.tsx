import { useEffect, useState } from "react";
import { apiClient } from "../data/apiClient";
import {
  addDays,
  addWeeks,
  formatDateLabel,
  formatWeekRange,
  startOfWeek,
} from "../lib/date";
import { toErrorMessage } from "../lib/errors";
import type {
  CalendarSubscriptionStatus,
  CurrentUser,
} from "../types";

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

const emptySubscriptionStatus: CalendarSubscriptionStatus = {
  active: false,
};

export function CalendarExport({ currentUser }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [weeks, setWeeks] = useState<CalendarWindow>(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(
    null,
  );
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<CalendarSubscriptionStatus>(emptySubscriptionStatus);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isMutatingSubscription, setIsMutatingSubscription] = useState(false);

  const visibleRangeEnd = addWeeks(weekStart, weeks);
  const exportRangeEnd = addDays(visibleRangeEnd, -1);

  useEffect(() => {
    let isCancelled = false;

    async function loadSubscriptionStatus() {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);
      setSubscriptionMessage(null);
      setSubscriptionUrl(null);

      try {
        const nextStatus = await apiClient.getCalendarSubscriptionStatus(
          currentUser.id,
        );

        if (!isCancelled) {
          setSubscriptionStatus(nextStatus);
        }
      } catch (error) {
        if (!isCancelled) {
          setSubscriptionStatus(emptySubscriptionStatus);
          setSubscriptionError(
            toErrorMessage(error, "Unable to load subscription status."),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSubscription(false);
        }
      }
    }

    void loadSubscriptionStatus();

    return () => {
      isCancelled = true;
    };
  }, [currentUser.id]);

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

  async function handleGenerateOrRegenerateSubscription() {
    try {
      setIsMutatingSubscription(true);
      setSubscriptionError(null);
      setSubscriptionMessage(null);

      const nextSubscription =
        await apiClient.createOrRegenerateCalendarSubscription(currentUser.id);

      setSubscriptionStatus(nextSubscription.status);
      setSubscriptionUrl(nextSubscription.subscriptionUrl);
      setSubscriptionMessage(
        subscriptionStatus.active
          ? "Generated a new private subscription URL. The previous URL stopped working immediately."
          : "Generated a private subscription URL for your current schedule feed.",
      );
    } catch (error) {
      setSubscriptionError(
        toErrorMessage(error, "Unable to generate a private subscription URL."),
      );
    } finally {
      setIsMutatingSubscription(false);
    }
  }

  async function handleCopySubscriptionUrl() {
    if (!subscriptionUrl) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable.");
      }

      await navigator.clipboard.writeText(subscriptionUrl);
      setSubscriptionMessage("Copied the private subscription URL.");
    } catch {
      setSubscriptionError(
        "Copy failed in this browser. Select and copy the URL manually.",
      );
    }
  }

  async function handleRevokeSubscription() {
    try {
      setIsMutatingSubscription(true);
      setSubscriptionError(null);
      setSubscriptionMessage(null);

      const nextStatus = await apiClient.revokeCalendarSubscription(
        currentUser.id,
      );

      setSubscriptionStatus(nextStatus);
      setSubscriptionUrl(null);
      setSubscriptionMessage(
        "Revoked the private subscription URL. Existing feed URLs now fail safely.",
      );
    } catch (error) {
      setSubscriptionError(
        toErrorMessage(error, "Unable to revoke the private subscription URL."),
      );
    } finally {
      setIsMutatingSubscription(false);
    }
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>My work schedule outside Teams</h2>
        </div>
        <span className="pill">Download and subscribe</span>
      </div>

      <p className="lead">
        Use your favorite calendar without replacing Teams Shifts. Download a
        one-time snapshot or create a private subscription that stays in sync
        whenever the feed data changes.
      </p>

      {currentUser.isDemo && (
        <article className="card empty-state" role="note">
          <h3>Preview/demo behavior</h3>
          <p className="muted">
            Subscription management is currently tied to the selected preview
            identity. Switching preview users shows only that identity&apos;s
            schedule feed and subscription state.
          </p>
        </article>
      )}

      <section className="card hero-panel">
        <div>
          <h3>Download calendar (.ics)</h3>
          <p className="muted">
            This is a one-time snapshot for the selected window. It does not
            update automatically after import.
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
          The downloaded file includes only your schedule for the selected{" "}
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
      </section>

      <section className="card calendar-section">
        <div className="group-header">
          <h3>Subscribe to calendar</h3>
          <span className="muted">Private, revocable feed</span>
        </div>

        <p className="muted">
          A subscription updates automatically when external calendar apps fetch
          the feed again. The URL is private and belongs only to the current
          user. Anyone with the URL could view that schedule, so it should not
          be shared.
        </p>

        <div className="card-grid">
          <article className="card inset-card">
            <h4>One-time download</h4>
            <p className="muted">
              Use when you want a snapshot you can import once.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Private subscription</h4>
            <p className="muted">
              Use when you want Apple Calendar, Google Calendar, Outlook, or
              another ICS-compatible app to refresh this schedule over time.
            </p>
          </article>
        </div>

        {isLoadingSubscription ? (
          <article className="card inset-card empty-state" aria-live="polite">
            <h4>Loading subscription status</h4>
            <p className="muted">
              Checking whether the current preview identity already has a
              private calendar feed.
            </p>
          </article>
        ) : (
          <div className="subscription-stack">
            <div className="subscription-actions">
              <button
                className="primary-button"
                type="button"
                disabled={isMutatingSubscription}
                onClick={() => void handleGenerateOrRegenerateSubscription()}
              >
                {isMutatingSubscription
                  ? "Updating subscription..."
                  : subscriptionStatus.active
                    ? "Regenerate URL"
                    : "Generate private subscription"}
              </button>

              {subscriptionUrl && (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void handleCopySubscriptionUrl()}
                >
                  Copy subscription URL
                </button>
              )}

              {subscriptionStatus.active && (
                <button
                  className="ghost-button"
                  type="button"
                  disabled={isMutatingSubscription}
                  onClick={() => void handleRevokeSubscription()}
                >
                  Revoke subscription
                </button>
              )}
            </div>

            {subscriptionUrl ? (
              <label className="field">
                Private subscription URL
                <input
                  className="subscription-url-field"
                  readOnly
                  value={subscriptionUrl}
                />
                <span className="field-help">
                  This raw URL is shown only right after generation or
                  regeneration. If you leave or refresh the page, generate a
                  new one instead.
                </span>
              </label>
            ) : subscriptionStatus.active ? (
              <article className="card inset-card empty-state" role="note">
                <h4>Active subscription exists</h4>
                <p className="muted">
                  A private feed already exists for this user, but the raw URL
                  cannot be recovered from storage. Regenerate it to reveal a
                  new URL or revoke it to disable feed access.
                </p>
              </article>
            ) : (
              <article className="card inset-card empty-state" role="note">
                <h4>No active subscription yet</h4>
                <p className="muted">
                  Generate a private URL when you want your calendar app to stay
                  in sync automatically.
                </p>
              </article>
            )}

            {subscriptionMessage && (
              <p className="success-message" role="status">
                {subscriptionMessage}
              </p>
            )}

            {subscriptionError && (
              <article className="card inset-card empty-state" role="alert">
                <h4>Subscription needs attention</h4>
                <p className="muted">{subscriptionError}</p>
              </article>
            )}
          </div>
        )}

        <ul className="privacy-list">
          <li>External calendar providers receive the shift data when they fetch the feed.</li>
          <li>The feed contains only the current user&apos;s shifts.</li>
          <li>Regenerating a URL invalidates the previous one immediately.</li>
          <li>Revoking a subscription disables the feed immediately.</li>
        </ul>
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Setup guidance</h3>
          <span className="muted">ICS-compatible calendars</span>
        </div>

        <div className="privacy-grid">
          <article className="card inset-card">
            <h4>Apple Calendar</h4>
            <p className="muted">
              Add the private URL as a new calendar subscription, then confirm
              the refresh settings you want on your Apple device.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Google Calendar</h4>
            <p className="muted">
              In Google Calendar, add the subscription from URL so Google can
              fetch updates from the private feed over time.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Outlook</h4>
            <p className="muted">
              Use Outlook&apos;s subscribe-from-web option and paste the private
              feed URL instead of importing a one-time file.
            </p>
          </article>
        </div>
      </section>
    </section>
  );
}
