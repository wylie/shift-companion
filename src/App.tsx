import { useEffect, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { ManagerView } from "./components/ManagerView";
import { MySchedule } from "./components/MySchedule";
import { MyUnavailability } from "./components/MyUnavailability";
import { SettingsPrivacy } from "./components/SettingsPrivacy";
import { apiClient } from "./data/apiClient";
import { canAccessManagerView, getVisibleNavItems } from "./lib/access";
import { useTeamsRuntime } from "./lib/teams";
import type { AppBootstrap, NavItem } from "./types";

const navItems: NavItem[] = [
  { id: "unavailability", label: "My Unavailability" },
  { id: "schedule", label: "My Schedule" },
  { id: "manager", label: "Manager View" },
  { id: "settings", label: "Settings / Privacy" },
];

export default function App() {
  const [activeView, setActiveView] = useState<NavItem["id"]>("unavailability");
  const [selectedPreviewUserId, setSelectedPreviewUserId] = useState<string>();
  const [bootstrap, setBootstrap] = useState<AppBootstrap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [teamsReloadKey, setTeamsReloadKey] = useState(0);
  const teamsRuntime = useTeamsRuntime(teamsReloadKey);
  const isBrowserPreview = teamsRuntime.mode === "browserPreview";
  const teamsToken = teamsRuntime.sso.status === "tokenReady"
    ? teamsRuntime.sso.token
    : undefined;
  const canLoadBootstrap = isBrowserPreview || Boolean(teamsToken);

  useEffect(() => {
    apiClient.configureSession(
      isBrowserPreview
        ? {
            previewUserId: selectedPreviewUserId,
            runtimeMode: "browserPreview",
          }
        : {
            runtimeMode: "teams",
            teamsAuthToken: teamsToken,
          },
    );
  }, [isBrowserPreview, selectedPreviewUserId, teamsToken]);

  useEffect(() => {
    if (!canLoadBootstrap) {
      setIsLoading(false);
      setBootstrap(null);
      return;
    }

    let isCancelled = false;

    async function loadBootstrap() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextBootstrap = await apiClient.getBootstrap(
          isBrowserPreview ? selectedPreviewUserId : undefined,
        );

        if (isCancelled) {
          return;
        }

        setBootstrap(nextBootstrap);

        if (!selectedPreviewUserId && isBrowserPreview) {
          setSelectedPreviewUserId(nextBootstrap.currentUser.id);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setBootstrap(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load demo data.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBootstrap();

    return () => {
      isCancelled = true;
    };
  }, [
    canLoadBootstrap,
    isBrowserPreview,
    reloadKey,
    selectedPreviewUserId,
    teamsToken,
  ]);

  const currentUser = bootstrap?.currentUser;

  useEffect(() => {
    if (
      currentUser &&
      !canAccessManagerView(currentUser) &&
      activeView === "manager"
    ) {
      setActiveView("unavailability");
    }
  }, [activeView, currentUser]);

  if (isLoading && !bootstrap) {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" aria-live="polite">
            <h2>
              {isBrowserPreview
                ? "Loading demo workspace"
                : "Loading Teams workspace"}
            </h2>
            <p className="muted">
              {isBrowserPreview
                ? "Connecting to the current preview data source for demo identities, schedules, and unavailable rules."
                : "Verifying the Teams tab identity and loading only the mapped app user's data."}
            </p>
          </article>
        </section>
      </main>
    );
  }

  if (teamsRuntime.mode === "teamsInitializing") {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" aria-live="polite">
            <h2>Connecting to Teams workspace</h2>
            <p className="muted">
              Initializing the Microsoft Teams runtime and requesting a
              tab-scoped sign-in token.
            </p>
          </article>
        </section>
      </main>
    );
  }

  if (teamsRuntime.mode === "teamsUnavailable") {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>Teams host unavailable</h2>
            <p className="muted">
              {teamsRuntime.errorMessage ??
                "Teams context could not be established for this tab."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setTeamsReloadKey((current) => current + 1)}
            >
              Retry Teams setup
            </button>
          </article>
        </section>
      </main>
    );
  }

  if (!isBrowserPreview && teamsRuntime.sso.status === "setupRequired") {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>Teams SSO setup needed</h2>
            <p className="muted">
              {teamsRuntime.sso.errorMessage ??
                "Teams tab SSO is not configured yet for this environment."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setTeamsReloadKey((current) => current + 1)}
            >
              Retry Teams sign-in
            </button>
          </article>
        </section>
      </main>
    );
  }

  if (!isBrowserPreview && teamsRuntime.sso.status === "tokenUnavailable") {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>Teams sign-in token unavailable</h2>
            <p className="muted">
              {teamsRuntime.sso.errorMessage ??
                "The Teams host didn't provide an auth token for this tab."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setTeamsReloadKey((current) => current + 1)}
            >
              Retry Teams sign-in
            </button>
          </article>
        </section>
      </main>
    );
  }

  if (!bootstrap || !currentUser) {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>
              {isBrowserPreview
                ? "Unable to load demo workspace"
                : "Teams user access not ready"}
            </h2>
            <p className="muted">
              {errorMessage ?? "Try refreshing the page."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setReloadKey((current) => current + 1);
                if (!isBrowserPreview) {
                  setTeamsReloadKey((current) => current + 1);
                }
              }}
            >
              Retry
            </button>
          </article>
        </section>
      </main>
    );
  }

  const visibleNavItems = getVisibleNavItems(navItems, currentUser);
  const currentUserDepartmentLabel = bootstrap.currentUserDepartments
    .map((department) => department.name)
    .join(" + ");

  return (
    <div className="app-shell">
      <AppSidebar
        activeView={activeView}
        currentUser={currentUser}
        currentUserDepartmentLabel={currentUserDepartmentLabel}
        teamsRuntime={teamsRuntime}
        mockUsers={bootstrap.previewUsers}
        navItems={visibleNavItems}
        onSelectView={setActiveView}
        onUserChange={setSelectedPreviewUserId}
      />

      <main className="content">
        {!isBrowserPreview && teamsRuntime.mode === "teamsReady" && (
          <article className="card empty-state" role="note">
            <h3>Teams identity verified</h3>
            <p className="muted">
              This tab is running in Teams with a server-verified identity
              mapping. Authorization still stays inside the existing app service
              and repository boundaries, and Microsoft Graph or Teams Shifts
              data is not connected yet.
            </p>
          </article>
        )}

        {errorMessage && (
          <article className="card empty-state" role="status">
            <h3>
              {isBrowserPreview
                ? "Demo data fallback notice"
                : "Teams workspace notice"}
            </h3>
            <p className="muted">{errorMessage}</p>
          </article>
        )}

        {activeView === "unavailability" && (
          <MyUnavailability currentUser={currentUser} />
        )}
        {activeView === "schedule" && <MySchedule currentUser={currentUser} />}
        {activeView === "manager" && <ManagerView currentUser={currentUser} />}
        {activeView === "settings" && (
          <SettingsPrivacy
            appVersion={bootstrap.appVersion}
            currentUser={currentUser}
            feedbackEmail={bootstrap.feedbackEmail}
          />
        )}
      </main>
    </div>
  );
}
