import { useEffect, useState } from "react";
import { apiClient } from "../data/apiClient";
import type { AuditEvent, CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

export function SettingsPrivacy({ currentUser }: Props) {
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
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the demo audit trail.",
          );
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
      </div>

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
