import { useEffect, useState } from "react";
import { currentUsers } from "./data/mockData";
import { initializeTeamsSdk } from "./lib/teams";
import type { CurrentUser, NavItem } from "./types";
import { AppSidebar } from "./components/AppSidebar";
import { ManagerView } from "./components/ManagerView";
import { MySchedule } from "./components/MySchedule";
import { MyUnavailability } from "./components/MyUnavailability";
import { SettingsPrivacy } from "./components/SettingsPrivacy";

const navItems: NavItem[] = [
  { id: "unavailability", label: "My Unavailability" },
  { id: "schedule", label: "My Schedule" },
  { id: "manager", label: "Manager View" },
  { id: "settings", label: "Settings / Privacy" },
];

export default function App() {
  const [activeView, setActiveView] = useState<NavItem["id"]>("unavailability");
  const [userMode, setUserMode] = useState<CurrentUser["role"]>("staff");
  const [isTeamsContext, setIsTeamsContext] = useState(false);

  const currentUser = currentUsers[userMode];

  useEffect(() => {
    // Future Teams context, theme, and SSO wiring belongs here.
    void initializeTeamsSdk().then(setIsTeamsContext);
  }, []);

  return (
    <div className="app-shell">
      <AppSidebar
        activeView={activeView}
        currentUser={currentUser}
        isTeamsContext={isTeamsContext}
        navItems={navItems}
        onSelectView={setActiveView}
        onUserModeChange={setUserMode}
      />

      <main className="content">
        {activeView === "unavailability" && (
          <MyUnavailability currentUser={currentUser} />
        )}
        {activeView === "schedule" && <MySchedule currentUser={currentUser} />}
        {activeView === "manager" && <ManagerView currentUser={currentUser} />}
        {activeView === "settings" && <SettingsPrivacy />}
      </main>
    </div>
  );
}
