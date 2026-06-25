import type { CurrentUser, NavItem, PreviewUser } from "../types";

type Props = {
  activeView: NavItem["id"];
  currentUser: CurrentUser;
  currentUserDepartmentLabel: string;
  isTeamsContext: boolean;
  mockUsers: PreviewUser[];
  navItems: NavItem[];
  onSelectView: (view: NavItem["id"]) => void;
  onUserChange: (userId: string) => void;
};

export function AppSidebar({
  activeView,
  currentUser,
  currentUserDepartmentLabel,
  isTeamsContext,
  mockUsers,
  navItems,
  onSelectView,
  onUserChange,
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
          Preview identity
          <select
            className="select-control"
            aria-describedby="identity-preview-help"
            value={currentUser.id}
            onChange={(event) => onUserChange(event.target.value)}
          >
            {mockUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.role === "manager" ? "Manager" : "Staff"}
              </option>
            ))}
          </select>
          <span className="sidebar-helper" id="identity-preview-help">
            Mocked identity preview only. Real roles and access will come from
            Teams, Entra, and app records later.
          </span>
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

        <div className="demo-notice" role="note">
          <strong>Demo data only.</strong> No YMCA, Microsoft Graph, or Teams
          Shifts data is connected.
        </div>
      </div>

      <div className="status-card">
        <strong>{currentUser.name}</strong>
        <span>
          {currentUser.role === "manager" ? "Manager" : "Staff member"}
        </span>
        <span>{currentUserDepartmentLabel}</span>
        <span>
          {isTeamsContext ? "Teams SDK ready" : "Browser preview mode"}
        </span>
      </div>
    </aside>
  );
}
