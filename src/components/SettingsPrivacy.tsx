import { useEffect, useState } from "react";
import { apiClient } from "../data/apiClient";
import { toErrorMessage } from "../lib/errors";
import type { AuditEvent, CurrentUser } from "../types";

type Props = {
  appVersion: string;
  buildEnvironment: "development" | "production" | "test";
  currentUser: CurrentUser;
  dataSource: "in-memory" | "postgres";
  documentationUrl?: string;
  feedbackEmail?: string;
};

function buildFeedbackHref(params: {
  appVersion: string;
  currentUserName: string;
  feedbackEmail: string;
  type: "bug" | "feature";
}) {
  const subject =
    params.type === "feature"
      ? `Feature request for Teams Shifts Companion v${params.appVersion}`
      : `Bug report for Teams Shifts Companion v${params.appVersion}`;
  const body =
    params.type === "feature"
      ? [
          "What should change?",
          "",
          "Why does it matter for your workflow?",
          "",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n")
      : [
          "What happened?",
          "",
          "What did you expect to happen?",
          "",
          "How can this be reproduced?",
          "",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n");

  return `mailto:${params.feedbackEmail}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

export function SettingsPrivacy({
  appVersion,
  buildEnvironment,
  currentUser,
  dataSource,
  documentationUrl,
  feedbackEmail,
}: Props) {
  const [visibleAuditEvents, setVisibleAuditEvents] = useState<AuditEvent[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAuditEvents() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextEvents = await apiClient.getAuditEvents(currentUser.id);

        if (!isCancelled) {
          setVisibleAuditEvents(nextEvents);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(toErrorMessage(error, "Unable to load the demo audit trail."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditEvents();

    return () => {
      isCancelled = true;
    };
  }, [currentUser.id]);

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings / Privacy</p>
          <h2>Privacy by default</h2>
        </div>
        <span className="pill">No live data</span>
      </div>

      <div className="card-grid">
        <article className="card">
          <h3>Staff visibility</h3>
          <p>Staff only see their own schedule and unavailability.</p>
        </article>
        <article className="card">
          <h3>Manager visibility</h3>
          <p>
            Managers only see staff and conflict data for teams they manage.
          </p>
        </article>
        <article className="card">
          <h3>Calendar export</h3>
          <p>
            Server-side `.ics` downloads are individual-only now. Private
            subscription links remain a future revocable feature.
          </p>
        </article>
        <article className="card">
          <h3>Current environment</h3>
          <p>
            No real Shifts, Microsoft Graph, YMCA, or production auth is
            connected yet.
          </p>
        </article>
        <article className="card">
          <h3>App version</h3>
          <p>Current release: v{appVersion}</p>
        </article>
        <article className="card">
          <h3>Build environment</h3>
          <p>{buildEnvironment}</p>
        </article>
        <article className="card">
          <h3>Data source</h3>
          <p>{dataSource === "postgres" ? "Postgres / Neon" : "In-memory demo data"}</p>
        </article>
      </div>

      <section className="card">
        <div className="group-header">
          <h3>Feedback</h3>
          <span className="muted">Settings entry point</span>
        </div>
        <p className="muted">
          New feature requests should be submitted here so product scope stays
          intentional and traceable. Bugs should use the same path so support
          has the current version and workflow context.
        </p>

        {feedbackEmail ? (
          <div className="feedback-stack">
            <div className="calendar-actions">
              <a
                className="primary-button button-link"
                href={buildFeedbackHref({
                  appVersion,
                  currentUserName: currentUser.name,
                  feedbackEmail,
                  type: "feature",
                })}
              >
                Request a feature
              </a>
              <a
                className="ghost-button button-link"
                href={buildFeedbackHref({
                  appVersion,
                  currentUserName: currentUser.name,
                  feedbackEmail,
                  type: "bug",
                })}
              >
                Report a bug
              </a>
            </div>
            <p className="muted">
              Opens your mail app to {feedbackEmail}. Include screenshots or
              steps when reporting bugs.
            </p>
          </div>
        ) : (
          <article className="card inset-card empty-state" role="alert">
            <h4>Feedback email not configured</h4>
            <p className="muted">
              Set `FEEDBACK_EMAIL` on the server to enable feature request and
              bug report links from Settings.
            </p>
          </article>
        )}
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Documentation</h3>
          <span className="muted">MVP guidance</span>
        </div>
        <p className="muted">
          The project documentation explains setup, release flow, and the
          lightweight companion boundaries that keep this app from expanding
          into a full workflow manager.
        </p>
        {documentationUrl ? (
          <div className="feedback-stack">
            <div className="calendar-actions">
              <a
                className="ghost-button button-link"
                href={documentationUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open project documentation
              </a>
            </div>
            <p className="muted">Opens the configured public documentation URL.</p>
          </div>
        ) : (
          <article className="card inset-card empty-state">
            <h4>Documentation lives in the repository</h4>
            <p className="muted">
              Keep README and the `docs/` folder current as part of release
              preparation and maintenance work.
            </p>
          </article>
        )}
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Mock audit trail</h3>
          <span className="muted">Persisted demo data</span>
        </div>
        <p className="muted">
          These demo events are filtered to the selected preview identity. They
          remain demo-only and are not connected to live YMCA or Teams data.
        </p>

        {errorMessage && (
          <article className="card inset-card empty-state" role="alert">
            <h4>Audit trail unavailable</h4>
            <p className="muted">{errorMessage}</p>
          </article>
        )}

        {isLoading ? (
          <article className="card inset-card empty-state" aria-live="polite">
            <h4>Loading demo audit events</h4>
            <p className="muted">
              Fetching only the selected preview identity&apos;s audit trail.
            </p>
          </article>
        ) : visibleAuditEvents.length > 0 ? (
          <div className="audit-list">
            {visibleAuditEvents.map((event) => (
              <article className="audit-row" key={event.id}>
                <p>{event.summary}</p>
                <p className="muted">
                  {event.timestamp.replace("T", " ").slice(0, 16)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <article className="card inset-card empty-state">
            <h4>No demo audit events yet</h4>
            <p className="muted">
              This preview identity has no persisted demo audit entries right
              now.
            </p>
          </article>
        )}
      </section>
    </section>
  );
}
