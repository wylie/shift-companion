import type { CurrentUser, NavItem } from "../types";

type Props = {
  activeView: NavItem["id"];
  currentUser: CurrentUser;
  isTeamsContext: boolean;
  navItems: NavItem[];
  onSelectView: (view: NavItem["id"]) => void;
  onUserModeChange: (role: CurrentUser["role"]) => void;
};

export function AppSidebar({
  activeView,
  currentUser,
  isTeamsContext,
  navItems,
  onSelectView,
  onUserModeChange,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div>
          <p className="eyebrow">Teams Shifts Companion</p>
          <h1>Staff scheduling companion</h1>
          <p className="muted sidebar-muted">
            Mocked tab experience designed for future Microsoft Teams packaging.
          </p>
        </div>

        <label className="mode-toggle">
          Demo role
          <select
            value={currentUser.role}
            onChange={(event) =>
              onUserModeChange(event.target.value as CurrentUser["role"])
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
              onClick={() => onSelectView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

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
  );
}
