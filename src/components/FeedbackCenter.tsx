import { buildFeedbackHref } from "../lib/feedback";

type Props = {
  appVersion: string;
  currentUserName: string;
  feedbackEmail?: string;
};

export function FeedbackCenter({
  appVersion,
  currentUserName,
  feedbackEmail,
}: Props) {
  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Feedback</p>
          <h2>Help shape the calendar companion</h2>
        </div>
        <span className="pill">Lightweight by design</span>
      </div>

      <p className="lead">
        Send feedback when something blocks schedule access or when a calendar
        workflow would make Teams Shifts more useful without replacing it.
      </p>

      {feedbackEmail ? (
        <section className="card hero-panel">
          <div>
            <h3>Share product feedback</h3>
            <p className="muted">
              Use feature requests for ideas like calendar subscriptions or
              live sync. Use bug reports when schedule access, export, or
              settings do not behave as expected.
            </p>
          </div>

          <div className="calendar-actions">
            <a
              className="primary-button button-link"
              href={buildFeedbackHref({
                appVersion,
                currentUserName,
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
                currentUserName,
                feedbackEmail,
                type: "bug",
              })}
            >
              Report a bug
            </a>
          </div>

          <p className="muted">
            Opens your mail app to {feedbackEmail}. Include screenshots or
            reproduction steps when reporting a bug.
          </p>
        </section>
      ) : (
        <article className="card empty-state" role="alert">
          <h3>Feedback email not configured</h3>
          <p className="muted">
            Set `FEEDBACK_EMAIL` on the server to enable feature and bug report
            links.
          </p>
        </article>
      )}

      <div className="card-grid">
        <article className="card">
          <h3>Best-fit feedback</h3>
          <p>
            Ask for improvements that help people access their Teams Shifts
            schedule from the calendar they already use.
          </p>
        </article>
        <article className="card">
          <h3>Out of scope signals</h3>
          <p>
            Requests to replace Teams Shifts authoring, approvals, payroll, or
            chat should be treated as product boundary checks.
          </p>
        </article>
      </div>
    </section>
  );
}
