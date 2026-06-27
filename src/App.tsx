import { useEffect, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { ManagerView } from "./components/ManagerView";
import { MySchedule } from "./components/MySchedule";
import { MyUnavailability } from "./components/MyUnavailability";
import { SettingsPrivacy } from "./components/SettingsPrivacy";
import { apiClient } from "./data/apiClient";
import { toErrorMessage } from "./lib/errors";
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
  const isTeamsInitializing = teamsRuntime.mode === "teamsInitializing";
  const teamsToken = teamsRuntime.sso.status === "tokenReady"
    ? teamsRuntime.sso.token
    : undefined;

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
    if (isTeamsInitializing) {
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

        if (
          !selectedPreviewUserId &&
          isBrowserPreview &&
          nextBootstrap.currentUser
        ) {
          setSelectedPreviewUserId(nextBootstrap.currentUser.id);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setBootstrap(null);
        setErrorMessage(toErrorMessage(error, "Unable to load demo data."));
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
    isBrowserPreview,
    isTeamsInitializing,
    reloadKey,
    selectedPreviewUserId,
    teamsToken,
  ]);

  const authSession = bootstrap?.auth;
  const currentUser = bootstrap?.currentUser;
  const isPreviewAuth = authSession?.providerId === "preview-demo";

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
              {isBrowserPreview ? "Loading demo workspace" : "Loading workspace"}
            </h2>
            <p className="muted">
              {isBrowserPreview
                ? "Connecting to the current preview data source for demo identities, schedules, and unavailable rules."
                : "Checking the current auth mode and loading the scoped workspace for this environment."}
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

  if (!bootstrap) {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>{isBrowserPreview ? "Unable to load demo workspace" : "Workspace access not ready"}</h2>
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

  if (!currentUser || authSession?.status !== "authenticated") {
    return (
      <main className="content">
        <section className="screen">
          <article className="card empty-state" role="alert">
            <h2>Authentication setup needed</h2>
            <p className="muted">
              {authSession?.message ??
                "This environment is not ready to resolve a signed-in app user yet."}
            </p>
            {!isBrowserPreview && teamsRuntime.sso.errorMessage && (
              <p className="muted">{teamsRuntime.sso.errorMessage}</p>
            )}
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setReloadKey((current) => current + 1);
                setTeamsReloadKey((current) => current + 1);
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
        auth={bootstrap.auth}
        currentUser={currentUser}
        currentUserDepartmentLabel={currentUserDepartmentLabel}
        teamsRuntime={teamsRuntime}
        mockUsers={bootstrap.previewUsers}
        navItems={visibleNavItems}
        onSelectView={setActiveView}
        onUserChange={setSelectedPreviewUserId}
      />

      <main className="content">
        {!isPreviewAuth && (
          <article className="card empty-state" role="note">
            <h3>Future Microsoft auth boundary</h3>
            <p className="muted">
              This environment is using the reserved Microsoft auth boundary.
              Real Entra sign-in, token verification, and app-user mapping are
              still intentionally disabled for this MVP.
            </p>
          </article>
        )}

        {errorMessage && (
          <article className="card empty-state" role="status">
            <h3>
              {isPreviewAuth
                ? "Demo data fallback notice"
                : "Workspace notice"}
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
            auth={bootstrap.auth}
            appVersion={bootstrap.appVersion}
            buildEnvironment={bootstrap.buildEnvironment}
            currentUser={currentUser}
            dataSource={bootstrap.dataSource}
            documentationUrl={bootstrap.documentationUrl}
            feedbackEmail={bootstrap.feedbackEmail}
            providerStatus={bootstrap.providerStatus}
          />
        )}
      </main>
    </div>
  );
}
