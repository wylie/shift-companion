import { appRepositories } from "../data/repositories";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

export function SettingsPrivacy({ currentUser }: Props) {
  const visibleAuditEvents = appRepositories.auditEvents.listForUser(
    currentUser.id,
  );

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
            Local `.ics` downloads are individual-only now. Private subscription
            links remain a future revocable feature.
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
          <span className="muted">Local only</span>
        </div>
        <p className="muted">
          These demo events are mocked in local state only and are filtered to
          the selected preview identity.
        </p>

        {visibleAuditEvents.length > 0 ? (
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
              This preview identity has no mocked local audit entries right now.
            </p>
          </article>
        )}
      </section>
    </section>
  );
}
