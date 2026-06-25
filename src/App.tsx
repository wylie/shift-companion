import { useEffect, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { ManagerView } from "./components/ManagerView";
import { MySchedule } from "./components/MySchedule";
import { MyUnavailability } from "./components/MyUnavailability";
import { SettingsPrivacy } from "./components/SettingsPrivacy";
import { apiClient } from "./data/apiClient";
import { canAccessManagerView, getVisibleNavItems } from "./lib/access";
import { initializeTeamsSdk } from "./lib/teams";
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
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Future Teams context, theme, and SSO wiring belongs here.
    void initializeTeamsSdk().then(setIsTeamsContext);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadBootstrap() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextBootstrap = await apiClient.getBootstrap(
          selectedPreviewUserId,
        );

        if (isCancelled) {
          return;
        }

        setBootstrap(nextBootstrap);

        if (!selectedPreviewUserId) {
          setSelectedPreviewUserId(nextBootstrap.currentUser.id);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

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
  }, [reloadKey, selectedPreviewUserId]);

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
            <h2>Loading demo workspace</h2>
            <p className="muted">
              Connecting to the current preview data source for demo identities,
              schedules, and unavailable rules.
            </p>
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
            <h2>Unable to load demo workspace</h2>
            <p className="muted">
              {errorMessage ?? "Try refreshing the page."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
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
        isTeamsContext={isTeamsContext}
        mockUsers={bootstrap.previewUsers}
        navItems={visibleNavItems}
        onSelectView={setActiveView}
        onUserChange={setSelectedPreviewUserId}
      />

      <main className="content">
        {errorMessage && (
          <article className="card empty-state" role="status">
            <h3>Demo data fallback notice</h3>
            <p className="muted">{errorMessage}</p>
          </article>
        )}

        {activeView === "unavailability" && (
          <MyUnavailability currentUser={currentUser} />
        )}
        {activeView === "schedule" && <MySchedule currentUser={currentUser} />}
        {activeView === "manager" && <ManagerView currentUser={currentUser} />}
        {activeView === "settings" && (
          <SettingsPrivacy currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
