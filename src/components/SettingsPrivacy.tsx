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
          <h2>Settings</h2>
        </div>
        <span className="pill">App info</span>
      </div>

      <div className="card-grid">
        <article className="card">
          <h3>Version</h3>
          <p>v{appVersion}</p>
        </article>
        <article className="card">
          <h3>Environment</h3>
          <p>{buildEnvironment}</p>
        </article>
        <article className="card">
          <h3>Auth</h3>
          <p>{auth.mode}</p>
        </article>
        <article className="card">
          <h3>Schedule provider</h3>
          <p>{formatProviderLabel(providerStatus.currentSchedule)}</p>
        </article>
        <article className="card">
          <h3>Data source</h3>
          <p>{dataSource === "postgres" ? "Postgres / Neon" : "In-memory demo data"}</p>
        </article>
        <article className="card">
          <p>
            {auth.providerId === "preview-demo" ? "Preview/demo" : "Setup needed"}
          </p>
        </article>
        <article className="card">
          <h3>Microsoft</h3>
          <p>
            Auth: {formatReadinessLabel(microsoftReadiness.auth)}. Graph:{" "}
            {formatReadinessLabel(microsoftReadiness.graph)}.
          </p>
        </article>
      </div>

      <section className="card">
        <div className="group-header">
          <h3>Upcoming Features</h3>
          <span className="muted">Planned, not live</span>
        </div>
        <div className="card-grid">
          <article className="card inset-card">
            <h4>Teams sign-in</h4>
          </article>
          <article className="card inset-card">
            <h4>Live Teams Shifts synchronization</h4>
          </article>
          <article className="card inset-card">
            <h4>Calendar improvements</h4>
          </article>
          <article className="card inset-card">
            <h4>Optional recurring availability</h4>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="group-header">
          <h3>Developer details</h3>
          <span className="muted">Diagnostics</span>
        </div>
        <details className="diagnostics-panel">
          <summary>Developer details</summary>

          <div className="diagnostics-stack">
            <div className="card-grid">
              <article className="card inset-card">
                <h4>Preview / demo mode</h4>
                <p>Active: {auth.providerId === "preview-demo" ? "Yes" : "No"}</p>
              </article>
              <article className="card inset-card">
                <h4>Authentication</h4>
                <p>Active provider: {formatProviderLabel(providerStatus.currentAuth)}</p>
                <p>Status: {formatStatusLabel(providerStatus.currentAuth)}</p>
                <p>Mode: {auth.mode}</p>
              </article>
              <article className="card inset-card">
                <h4>Schedule</h4>
                <p>Active provider: {formatProviderLabel(providerStatus.currentSchedule)}</p>
                <p>Status: {formatStatusLabel(providerStatus.currentSchedule)}</p>
              </article>
              <article className="card inset-card">
                <h4>Calendar export</h4>
                <p>Active provider: {formatProviderLabel(providerStatus.calendarExport)}</p>
                <p>Status: {formatStatusLabel(providerStatus.calendarExport)}</p>
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
              </article>
            </div>

            <section className="card inset-card">
              <div className="group-header">
                <h4>Microsoft Setup Checklist</h4>
                <span className="muted">Informational only</span>
              </div>
              <article className="card inset-card">
                <h4>Current readiness</h4>
                <p>Overall state: {formatReadinessStateLabel(microsoftReadiness.overall)}</p>
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

            <section className="card inset-card">
              <div className="group-header">
                <h4>Documentation</h4>
                <span className="muted">MVP guidance</span>
              </div>
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
                </div>
              ) : (
                <article className="card inset-card empty-state">
                  <h4>Documentation lives in the repository</h4>
                </article>
              )}
            </section>

            <section className="card inset-card">
              <div className="group-header">
                <h4>Mock audit trail</h4>
                <span className="muted">Persisted demo data</span>
              </div>

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
                    This preview identity has no persisted demo audit entries
                    right now.
                  </p>
                </article>
              )}
            </section>
          </div>
        </details>
      </section>
    </section>
  );
}
