import { useEffect, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { CalendarExport } from "./components/CalendarExport";
import { FeedbackCenter } from "./components/FeedbackCenter";
import { MySchedule } from "./components/MySchedule";
import { SettingsPrivacy } from "./components/SettingsPrivacy";
import { apiClient } from "./data/apiClient";
import { toErrorMessage } from "./lib/errors";
import { useTeamsRuntime } from "./lib/teams";
import type { AppBootstrap, NavItem } from "./types";

const navItems: NavItem[] = [
  { id: "schedule", label: "Schedule & Calendar" },
  { id: "settings", label: "Settings & Feedback" },
];

const legacySectionPaths: Record<string, "schedule" | "calendar" | "settings" | "feedback"> = {
  "/calendar": "calendar",
  "/feedback": "feedback",
  "/schedule": "schedule",
  "/settings": "settings",
};

function resolveHashSection(hash: string): "schedule" | "calendar" | "settings" | "feedback" {
  const normalized = hash.replace(/^#/, "");

  if (
    normalized === "calendar" ||
    normalized === "feedback" ||
    normalized === "settings"
  ) {
    return normalized;
  }

  return "schedule";
}

function getPageForSection(
  section: "schedule" | "calendar" | "settings" | "feedback",
): NavItem["id"] {
  return section === "settings" || section === "feedback"
    ? "settings"
    : "schedule";
}

export default function App() {
  const [activeView, setActiveView] = useState<NavItem["id"]>("schedule");
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
    if (typeof window === "undefined") {
      return;
    }

    const redirectedSection = legacySectionPaths[window.location.pathname];

    if (redirectedSection) {
      window.history.replaceState(null, "", `/#${redirectedSection}`);
    } else if (
      window.location.pathname !== "/" &&
      window.location.pathname !== ""
    ) {
      window.history.replaceState(
        null,
        "",
        `/#${resolveHashSection(window.location.hash)}`,
      );
    } else if (!window.location.hash) {
      window.history.replaceState(null, "", "/#schedule");
    }

    const syncSectionFromHash = () => {
      setActiveView(getPageForSection(resolveHashSection(window.location.hash)));
    };

    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
    };
  }, []);

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
    if (typeof window === "undefined" || !bootstrap || !currentUser) {
      return;
    }

    const sectionId = resolveHashSection(window.location.hash);
    const element = document.getElementById(sectionId);

    if (!element) {
      return;
    }

    requestAnimationFrame(() => {
      element.scrollIntoView({
        block: "start",
      });
    });
  }, [activeView, bootstrap, currentUser]);

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
                ? "Connecting to the current preview data source for demo identities, schedules, and calendar export."
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

  const currentUserDepartmentLabel = bootstrap.currentUserDepartments
    .map((department) => department.name)
    .join(" + ");

  function scrollToSection(section: "schedule" | "calendar" | "settings" | "feedback") {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash !== `#${section}`) {
      window.history.pushState(null, "", `/#${section}`);
    }

    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleSelectView(view: NavItem["id"]) {
    setActiveView(view);
    scrollToSection(view === "settings" ? "settings" : "schedule");
  }

  return (
    <div className="app-shell">
      <AppSidebar
        activeView={activeView}
        auth={bootstrap.auth}
        currentUser={currentUser}
        currentUserDepartmentLabel={currentUserDepartmentLabel}
        teamsRuntime={teamsRuntime}
        mockUsers={bootstrap.previewUsers}
        navItems={navItems}
        onSelectView={handleSelectView}
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

        {activeView === "schedule" ? (
          <div className="consolidated-page">
            <div className="anchor-section" id="schedule">
              <MySchedule currentUser={currentUser} />
            </div>

            <div className="anchor-section" id="calendar">
              <CalendarExport currentUser={currentUser} />
            </div>
          </div>
        ) : (
          <div className="consolidated-page">
            <div className="anchor-section" id="settings">
              <SettingsPrivacy
                auth={bootstrap.auth}
                appVersion={bootstrap.appVersion}
                buildEnvironment={bootstrap.buildEnvironment}
                currentUser={currentUser}
                dataSource={bootstrap.dataSource}
                documentationUrl={bootstrap.documentationUrl}
                microsoftReadiness={bootstrap.microsoftReadiness}
                providerStatus={bootstrap.providerStatus}
              />
            </div>

            <div className="anchor-section" id="feedback">
              <FeedbackCenter
                appVersion={bootstrap.appVersion}
                currentUserName={currentUser.name}
                feedbackEmail={bootstrap.feedbackEmail}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
