import { useEffect, useState } from "react";
import { currentUsers } from "./data/mockData";
import { initializeTeamsSdk } from "./lib/teams";
import type { CurrentUser, NavItem } from "./types";
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
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Teams Shifts Companion</p>
          <h1>Staff scheduling companion</h1>
          <p className="muted">
            Mocked tab experience designed for future Microsoft Teams packaging.
          </p>
        </div>

        <label className="mode-toggle">
          Demo role
          <select
            value={userMode}
            onChange={(event) =>
              setUserMode(event.target.value as CurrentUser["role"])
            }
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
        </label>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === activeView ? "nav-item active" : "nav-item"
              }
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="status-card">
          <strong>{currentUser.name}</strong>
          <span>
            {currentUser.role === "manager" ? "Manager" : "Staff member"}
          </span>
          <span>
            {isTeamsContext ? "Teams SDK ready" : "Browser preview mode"}
          </span>
        </div>
      </aside>

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
