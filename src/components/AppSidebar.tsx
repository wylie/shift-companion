import type {
  CurrentUser,
  NavItem,
  PreviewUser,
  TeamsRuntimeState,
} from "../types";

type Props = {
  activeView: NavItem["id"];
  currentUser: CurrentUser;
  currentUserDepartmentLabel: string;
  mockUsers: PreviewUser[];
  navItems: NavItem[];
  onSelectView: (view: NavItem["id"]) => void;
  onUserChange: (userId: string) => void;
  teamsRuntime: TeamsRuntimeState;
};

export function AppSidebar({
  activeView,
  currentUser,
  currentUserDepartmentLabel,
  mockUsers,
  navItems,
  onSelectView,
  onUserChange,
  teamsRuntime,
}: Props) {
  const isBrowserPreview = teamsRuntime.mode === "browserPreview";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div>
          <p className="eyebrow">Teams Shifts Companion</p>
          <h1>Staff scheduling companion</h1>
          <p className="muted sidebar-muted">
            Lightweight Teams-ready companion for personal schedule and
            unavailability workflows.
          </p>
        </div>

        {isBrowserPreview ? (
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
              Mocked identity preview only. Real roles and access will come
              from Teams, Entra, and app records later.
            </span>
          </label>
        ) : (
          <div className="runtime-indicator" role="note">
            <strong>Teams workspace</strong>
            <span className="sidebar-helper">
              Teams host context is active. Preview identity switching stays
              browser-only, and app access is resolved from verified Teams and
              Entra identity on the server.
            </span>
          </div>
        )}

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === activeView ? "page" : undefined}
              className={
                item.id === activeView ? "nav-item active" : "nav-item"
              }
              onClick={() => onSelectView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {isBrowserPreview ? (
          <div className="demo-notice" role="note">
            <strong>Demo data only.</strong> No YMCA, Microsoft Graph, or Teams
            Shifts data is connected.
          </div>
        ) : (
          <div className="demo-notice" role="note">
            <strong>Teams SSO only.</strong> No Microsoft Graph, live Teams
            Shifts, or YMCA data is connected yet.
          </div>
        )}
      </div>

      <div className="status-card">
        {isBrowserPreview ? (
          <>
            <strong>{currentUser.name}</strong>
            <span>
              {currentUser.role === "manager" ? "Manager" : "Staff member"}
            </span>
            <span>{currentUserDepartmentLabel}</span>
            <span>Browser preview mode</span>
          </>
        ) : (
          <>
            <strong>
              {teamsRuntime.context?.userDisplayName ??
                teamsRuntime.context?.userPrincipalName ??
                currentUser.name}
            </strong>
            <span>{currentUser.name}</span>
            <span>
              {teamsRuntime.context?.clientType
                ? `Client: ${teamsRuntime.context.clientType}`
                : "Client context pending"}
            </span>
            <span>
              {teamsRuntime.context?.hostName ?? "Microsoft Teams"} workspace
            </span>
          </>
        )}
      </div>
    </aside>
  );
}
