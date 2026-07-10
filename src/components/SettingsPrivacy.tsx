import { useEffect, useState } from "react";
import { apiClient } from "../data/apiClient";
import { toErrorMessage } from "../lib/errors";
import { microsoftSetupChecklist } from "../models/microsoft";
import type {
  AppAuthSession,
  AuditEvent,
  CurrentUser,
  MicrosoftIntegrationReadiness,
  MicrosoftReadinessCheck,
  ProviderStatus,
} from "../types";

type Props = {
  auth: AppAuthSession;
  appVersion: string;
  buildEnvironment: "development" | "production" | "test";
  currentUser: CurrentUser;
  dataSource: "in-memory" | "postgres";
  documentationUrl?: string;
  microsoftReadiness: MicrosoftIntegrationReadiness;
  providerStatus: {
    calendarExport: ProviderStatus;
    currentAuth: ProviderStatus;
    currentSchedule: ProviderStatus;
    database: {
      connected: boolean;
      migrationVersion?: string;
      name: string;
      status: "connected" | "demo";
    };
    feedback: ProviderStatus;
    microsoftAuth: ProviderStatus;
    microsoftGraph: ProviderStatus;
  };
};

function formatReadinessStateLabel(
  state: MicrosoftReadinessCheck["state"],
): string {
  if (state === "disabled") {
    return "Disabled";
  }

  if (state === "missing_config") {
    return "Setup needed";
  }

  return "Ready to test";
}

function formatReadinessLabel(check: MicrosoftReadinessCheck): string {
  return formatReadinessStateLabel(check.state);
}

function formatStatusLabel(status: ProviderStatus): string {
  if (status.availability === "disabled") {
    return "Disabled";
  }

  if (status.availability === "not_configured") {
    return "Not configured";
  }

  if (status.availability === "not_implemented") {
    return "Setup needed";
  }

  return "Available";
}

function formatProviderLabel(status: ProviderStatus): string {
  if (status.providerId === "preview-demo") {
    return "Preview/demo";
  }

  if (status.providerId === "neon-demo") {
    return "Neon/demo";
  }

  if (status.providerId === "microsoft-entra") {
    return "Microsoft Entra";
  }

  if (status.providerId === "microsoft-graph") {
    return "Microsoft Graph";
  }

  if (status.providerId === "feedback-email") {
    return "Feedback email";
  }

  return status.name;
}

export function SettingsPrivacy({
  auth,
  appVersion,
  buildEnvironment,
  currentUser,
  dataSource,
  documentationUrl,
  microsoftReadiness,
  providerStatus,
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
          <p className="eyebrow">Settings</p>
          <h2>Schedule access settings</h2>
        </div>
        <span className="pill">Companion boundaries</span>
      </div>

      <div className="card-grid">
        <article className="card">
          <h3>Personal schedule scope</h3>
          <p>Staff only see their own schedule and calendar export data.</p>
        </article>
        <article className="card">
          <h3>Manager review scope</h3>
          <p>
            Managers only see staff and conflict data for teams they manage.
          </p>
        </article>
        <article className="card">
          <h3>Calendar access</h3>
          <p>
            Server-side `.ics` downloads are individual-only, and private
            calendar subscriptions can be generated, regenerated, or revoked
            from the Calendar page.
          </p>
        </article>
        <article className="card">
          <h3>Current environment</h3>
          <p>
            {auth.providerId === "preview-demo"
              ? "Preview/demo auth is active. No real Teams Shifts, Microsoft Graph, or production sign-in is connected yet."
              : "Microsoft Entra auth is reserved for a future phase. This environment stays in a safe setup-needed state until real sign-in is implemented."}
          </p>
        </article>
        <article className="card">
          <h3>App version</h3>
          <p>Current release: v{appVersion}</p>
        </article>
        <article className="card">
          <h3>Authentication mode</h3>
          <p>{auth.mode}</p>
        </article>
        <article className="card">
          <h3>Schedule provider</h3>
          <p>{formatProviderLabel(providerStatus.currentSchedule)}</p>
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
          <h3>Upcoming Features</h3>
          <span className="muted">Planned, not live</span>
        </div>
        <p className="muted">
          The MVP stays focused on getting your Teams Shifts schedule into the
          calendar you already use. These items are planned next steps, not
          active functionality.
        </p>
        <div className="card-grid">
          <article className="card inset-card">
            <h4>Teams sign-in</h4>
            <p className="muted">
              Replace preview-only identity switching with real Microsoft sign-in.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Live Teams Shifts synchronization</h4>
            <p className="muted">
              Read published Shifts schedule data directly from Microsoft Graph.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Broader calendar support</h4>
            <p className="muted">
              Improve provider-specific guidance and refresh expectations across
              calendar clients.
            </p>
          </article>
          <article className="card inset-card">
            <h4>Optional recurring availability</h4>
            <p className="muted">
              Dormant availability workflows may return later as an optional feature.
            </p>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Integration Status</h3>
          <span className="muted">Developer diagnostics</span>
        </div>
        <p className="muted">
          These diagnostics describe the active integration providers and safe
          future Microsoft placeholders without exposing secrets.
        </p>
        <div className="card-grid">
          <article className="card inset-card">
            <h4>Preview / demo mode</h4>
            <p>Active: {auth.providerId === "preview-demo" ? "Yes" : "No"}</p>
            <p className="muted">
              {auth.providerId === "preview-demo"
                ? "Preview/demo mode is active. No Microsoft tenant or live sign-in is required for this environment."
                : "This environment is reserved for the future Microsoft auth boundary and remains in a safe setup-needed state."}
            </p>
          </article>
          <article className="card inset-card">
            <h4>Authentication</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.currentAuth)}</p>
            <p>Status: {formatStatusLabel(providerStatus.currentAuth)}</p>
            <p>Mode: {auth.mode}</p>
            <p className="muted">{providerStatus.currentAuth.message}</p>
          </article>
          <article className="card inset-card">
            <h4>Schedule</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.currentSchedule)}</p>
            <p>Status: {formatStatusLabel(providerStatus.currentSchedule)}</p>
            <p className="muted">{providerStatus.currentSchedule.message}</p>
          </article>
          <article className="card inset-card">
            <h4>Calendar export</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.calendarExport)}</p>
            <p>Status: {formatStatusLabel(providerStatus.calendarExport)}</p>
            <p className="muted">{providerStatus.calendarExport.message}</p>
          </article>
          <article className="card inset-card">
            <h4>Database</h4>
            <p>Connected: {providerStatus.database.connected ? "Yes" : "No"}</p>
            <p>Status: {providerStatus.database.status}</p>
            <p className="muted">
              {providerStatus.database.migrationVersion
                ? `Migration version: ${providerStatus.database.migrationVersion}`
                : "Migration version is not reported in the current runtime diagnostics."}
            </p>
          </article>
          <article className="card inset-card">
            <h4>Microsoft auth</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.microsoftAuth)}</p>
            <p>Status: {formatReadinessLabel(microsoftReadiness.auth)}</p>
            <p className="muted">{microsoftReadiness.auth.message}</p>
            {microsoftReadiness.auth.missingEnvVars.length > 0 && (
              <p className="muted">
                Missing config: {microsoftReadiness.auth.missingEnvVars.join(", ")}
              </p>
            )}
          </article>
          <article className="card inset-card">
            <h4>Microsoft Graph</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.microsoftGraph)}</p>
            <p>Status: {formatReadinessLabel(microsoftReadiness.graph)}</p>
            <p className="muted">{microsoftReadiness.graph.message}</p>
            {microsoftReadiness.graph.missingEnvVars.length > 0 && (
              <p className="muted">
                Missing config: {microsoftReadiness.graph.missingEnvVars.join(", ")}
              </p>
            )}
          </article>
          <article className="card inset-card">
            <h4>Feedback</h4>
            <p>Active provider: {formatProviderLabel(providerStatus.feedback)}</p>
            <p>Status: {formatStatusLabel(providerStatus.feedback)}</p>
            <p className="muted">{providerStatus.feedback.message}</p>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Microsoft Setup Checklist</h3>
          <span className="muted">Informational only</span>
        </div>
        <p className="muted">
          Use this checklist when real Microsoft integration work begins. It
          does not enable sign-in or Graph access by itself.
        </p>
        <article className="card inset-card">
          <h4>Current readiness</h4>
          <p>Overall state: {formatReadinessStateLabel(microsoftReadiness.overall)}</p>
          <p className="muted">
            Ready to test means the documented Microsoft environment variables
            and flags are present for the selected path. It does not mean real
            Entra sign-in or Graph calls exist yet.
          </p>
        </article>
        <div className="audit-list">
          {microsoftSetupChecklist.map((item) => (
            <article className="audit-row" key={item.id}>
              <div>
                <p>{item.title}</p>
                <p className="muted">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Feedback</h3>
          <span className="muted">Dedicated navigation item</span>
        </div>
        <p className="muted">
          Use the Feedback view to send feature requests or bug reports without
          expanding product scope by accident. It remains the place to propose
          improvements like subscriptions and live sync.
        </p>
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
