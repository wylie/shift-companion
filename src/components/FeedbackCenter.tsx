import { useState, type FormEvent } from "react";
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
  const [category, setCategory] = useState<"feature" | "bug">("feature");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feedbackEmail) {
      setErrorMessage("Feedback email is not configured for this environment.");
      setStatusMessage(null);
      return;
    }

    if (message.trim().length === 0) {
      setErrorMessage("Add a short message before sending feedback.");
      setStatusMessage(null);
      return;
    }

    const href = buildFeedbackHref({
      appVersion,
      contactEmail: contactEmail.trim() || undefined,
      currentUserName,
      feedbackEmail,
      message: message.trim(),
      type: category,
    });

    setErrorMessage(null);
    setStatusMessage("Opening your mail app with the prepared feedback draft.");
    window.location.href = href;
  }

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Feedback</p>
          <h2>Feedback</h2>
        </div>
        <span className="pill">Email draft</span>
      </div>

      {feedbackEmail ? (
        <section className="card">
          <form className="feedback-form" onSubmit={handleSubmit}>
            <label className="field">
              Category
              <select
                className="select-control"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as "feature" | "bug")}
              >
                <option value="feature">Feature request</option>
                <option value="bug">Bug report</option>
              </select>
            </label>

            <label className="field">
              Message
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  category === "feature"
                    ? "What would make your schedule easier to access?"
                    : "What happened, and what did you expect instead?"
                }
              />
            </label>

            <label className="field">
              Contact email
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="Optional"
              />
              <span className="field-help">
                Optional reply address.
              </span>
            </label>

            <div className="calendar-actions">
              <button className="primary-button" type="submit">
                Open feedback draft
              </button>
            </div>

            <p className="muted">Opens your mail app to {feedbackEmail}.</p>

            {statusMessage && (
              <p className="success-message" role="status">
                {statusMessage}
              </p>
            )}

            {errorMessage && (
              <article className="card inset-card empty-state" role="alert">
                <h4>Feedback needs attention</h4>
                <p className="muted">{errorMessage}</p>
              </article>
            )}
          </form>
        </section>
      ) : (
        <article className="card empty-state" role="alert">
          <h3>Feedback email not configured</h3>
          <p className="muted">Set `FEEDBACK_EMAIL` on the server.</p>
        </article>
      )}
    </section>
  );
}
