import { useEffect, useState } from "react";
import { mockUsers, teams } from "./data/mockData";
import { initializeTeamsSdk } from "./lib/teams";
import type { NavItem } from "./types";
import { AppSidebar } from "./components/AppSidebar";
import { ManagerView } from "./components/ManagerView";
import { MySchedule } from "./components/MySchedule";
import { MyUnavailability } from "./components/MyUnavailability";
import { SettingsPrivacy } from "./components/SettingsPrivacy";
import { canAccessManagerView, getVisibleNavItems } from "./lib/access";

const navItems: NavItem[] = [
  { id: "unavailability", label: "My Unavailability" },
  { id: "schedule", label: "My Schedule" },
  { id: "manager", label: "Manager View" },
  { id: "settings", label: "Settings / Privacy" },
];

export default function App() {
  const [activeView, setActiveView] = useState<NavItem["id"]>("unavailability");
  const [currentUserId, setCurrentUserId] = useState(mockUsers[0]!.id);
  const [isTeamsContext, setIsTeamsContext] = useState(false);

  const currentUser =
    mockUsers.find((user) => user.id === currentUserId) ?? mockUsers[0]!;
  const visibleNavItems = getVisibleNavItems(navItems, currentUser);
  const currentUserDepartmentLabel = currentUser.teamIds
    .map((teamId) => teams.find((team) => team.id === teamId)?.name ?? teamId)
    .join(" + ");

  useEffect(() => {
    // Future Teams context, theme, and SSO wiring belongs here.
    void initializeTeamsSdk().then(setIsTeamsContext);
  }, []);

  useEffect(() => {
    if (!canAccessManagerView(currentUser) && activeView === "manager") {
      setActiveView("unavailability");
    }
  }, [activeView, currentUser]);

  return (
    <div className="app-shell">
      <AppSidebar
        activeView={activeView}
        currentUser={currentUser}
        currentUserDepartmentLabel={currentUserDepartmentLabel}
        isTeamsContext={isTeamsContext}
        mockUsers={mockUsers}
        navItems={visibleNavItems}
        onSelectView={setActiveView}
        onUserChange={setCurrentUserId}
      />

      <main className="content">
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
