import { useEffect, useRef, useState } from "react";
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

const today = new Date();

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
  const subscriptionUrlInputRef = useRef<HTMLInputElement | null>(null);
  const copyMessageResetTimerRef = useRef<number | null>(null);
  const lastAutoCopyAtRef = useRef(0);
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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isMutatingSubscription, setIsMutatingSubscription] = useState(false);

  const visibleRangeEnd = addWeeks(weekStart, weeks);
  const exportRangeEnd = addDays(visibleRangeEnd, -1);

  useEffect(() => {
    return () => {
      if (copyMessageResetTimerRef.current !== null) {
        window.clearTimeout(copyMessageResetTimerRef.current);
      }
    };
  }, []);

  async function loadSubscriptionStatus() {
    setIsLoadingSubscription(true);
    setSubscriptionError(null);
    setSubscriptionMessage(null);
    setSubscriptionUrl(null);

    try {
      const nextStatus = await apiClient.getCalendarSubscriptionStatus(
        currentUser.id,
      );

      setSubscriptionStatus(nextStatus);
    } catch (error) {
      setSubscriptionStatus(emptySubscriptionStatus);
      setSubscriptionError(
        toErrorMessage(error, "Unable to load subscription status."),
      );
    } finally {
      setIsLoadingSubscription(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function load() {
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

    void load();

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
      setCopyFeedback(null);

      const nextSubscription = subscriptionStatus.active
        ? await apiClient.regenerateCalendarSubscription(currentUser.id)
        : await apiClient.createCalendarSubscription(currentUser.id);

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

  function selectSubscriptionUrl() {
    const input = subscriptionUrlInputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
  }

  function showCopyFeedback(message: string) {
    setCopyFeedback(message);

    if (copyMessageResetTimerRef.current !== null) {
      window.clearTimeout(copyMessageResetTimerRef.current);
    }

    copyMessageResetTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
      copyMessageResetTimerRef.current = null;
    }, 4000);
  }

  async function copySubscriptionUrlToClipboard() {
    if (!subscriptionUrl) {
      return;
    }

    selectSubscriptionUrl();

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable.");
      }

      await navigator.clipboard.writeText(subscriptionUrl);
      setSubscriptionError(null);
      showCopyFeedback("Subscription URL copied.");
    } catch {
      setSubscriptionError(null);
      showCopyFeedback("URL selected—press Command-C or Ctrl-C to copy.");
    }
  }

  async function handleCopySubscriptionUrl() {
    await copySubscriptionUrlToClipboard();
  }

  async function handleSubscriptionUrlInteraction() {
    const now = Date.now();

    if (now - lastAutoCopyAtRef.current < 200) {
      selectSubscriptionUrl();
      return;
    }

    lastAutoCopyAtRef.current = now;
    await copySubscriptionUrlToClipboard();
  }

  async function handleRevokeSubscription() {
    try {
      setIsMutatingSubscription(true);
      setSubscriptionError(null);
      setSubscriptionMessage(null);
      setCopyFeedback(null);

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
          <h2>My Calendar</h2>
        </div>
        <span className="pill">Calendar tools</span>
      </div>

      {currentUser.isDemo && (
        <article className="card empty-state" role="note">
          <h3>Preview mode</h3>
          <p className="muted">Subscriptions belong to the selected preview user.</p>
        </article>
      )}

      <div className="download-grid">
        <section className="card hero-panel download-controls-card">
          <div>
            <h3>Download calendar (.ics)</h3>
            <p className="muted">Downloads a one-time .ics file.</p>
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

        <section className="card calendar-section download-summary-card">
          <div className="group-header">
            <h3>{formatWeekRange(weekStart)}</h3>
            <span className="muted">
              {formatDateLabel(weekStart)} through {formatDateLabel(exportRangeEnd)}
            </span>
          </div>

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
      </div>

      <section className="card calendar-section">
        <div className="group-header">
          <h3>Calendar subscription</h3>
          <span className="muted">Private feed</span>
        </div>

        <p className="muted">Keeps your calendar updated automatically.</p>

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

            {subscriptionError ? (
              <article className="card inset-card empty-state" role="alert">
                <h4>Subscription needs attention</h4>
                <p className="muted">{subscriptionError}</p>
                <div className="calendar-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={isLoadingSubscription || isMutatingSubscription}
                    onClick={() => void loadSubscriptionStatus()}
                  >
                    Retry
                  </button>
                </div>
              </article>
            ) : subscriptionUrl ? (
              <label className="field">
                Private subscription URL
                <input
                  className="subscription-url-field"
                  ref={subscriptionUrlInputRef}
                  readOnly
                  value={subscriptionUrl}
                  onClick={() => void handleSubscriptionUrlInteraction()}
                  onFocus={() => void handleSubscriptionUrlInteraction()}
                />
                <span className="field-help">
                  Shown only after generate or regenerate.
                </span>
                <span
                  className="field-message"
                  aria-live="polite"
                  role="status"
                >
                  {copyFeedback}
                </span>
              </label>
            ) : subscriptionStatus.active ? (
              <article className="card inset-card empty-state" role="note">
                <h4>Active subscription exists</h4>
                <p className="muted">
                  Regenerate to reveal a new URL, or revoke to disable the feed.
                </p>
              </article>
            ) : (
              <article className="card inset-card empty-state" role="note">
                <h4>No active subscription yet</h4>
                <p className="muted">Generate a private URL to subscribe.</p>
              </article>
            )}

            {subscriptionMessage && (
              <p className="success-message" role="status">
                {subscriptionMessage}
              </p>
            )}

          </div>
        )}

      </section>

      <section className="card calendar-section">
        <div className="group-header">
          <h3>Calendar apps</h3>
          <span className="muted">ICS subscription</span>
        </div>

        <div className="privacy-grid">
          <article className="card inset-card">
            <h4>Apple Calendar</h4>
            <p className="muted">Add a new calendar subscription and paste the URL.</p>
          </article>
          <article className="card inset-card">
            <h4>Google Calendar</h4>
            <p className="muted">Use Add by URL and paste the private feed.</p>
          </article>
          <article className="card inset-card">
            <h4>Outlook</h4>
            <p className="muted">Use Subscribe from web and paste the URL.</p>
          </article>
        </div>
      </section>

      <section className="card calendar-section">
        <div className="group-header">
          <h3>Privacy</h3>
          <span className="muted">Feed access</span>
        </div>

        <ul className="privacy-list">
          <li>External calendar providers receive the shift data when they fetch the feed.</li>
          <li>The feed contains only the current user&apos;s shifts.</li>
          <li>Regenerating a URL invalidates the previous one immediately.</li>
          <li>Revoking a subscription disables the feed immediately.</li>
        </ul>
      </section>
    </section>
  );
}
