export function SettingsPrivacy() {
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
    </section>
  );
}
