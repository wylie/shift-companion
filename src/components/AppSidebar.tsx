import type {
  AppAuthSession,
  CurrentUser,
  NavItem,
  PreviewUser,
  TeamsRuntimeState,
} from "../types";

type Props = {
  activeView: NavItem["id"];
  auth: AppAuthSession;
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
  auth,
  currentUser,
  currentUserDepartmentLabel,
  mockUsers,
  navItems,
  onSelectView,
  onUserChange,
  teamsRuntime,
}: Props) {
  const isPreviewAuth = auth.providerId === "preview-demo";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div>
          <p className="eyebrow">Teams Shifts Companion</p>
          <h1>Your schedule, in the calendar you already use</h1>
          <p className="muted sidebar-muted">
            A lightweight companion for viewing Teams Shifts and exporting your
            schedule to Apple Calendar, Google Calendar, or Outlook.
          </p>
        </div>

        {isPreviewAuth ? (
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
              Mocked identity preview only. Real Microsoft sign-in is planned,
              and this selector remains the active local MVP path for now.
            </span>
          </label>
        ) : (
          <div className="runtime-indicator" role="note">
            <strong>Future Teams sign-in</strong>
            <span className="sidebar-helper">
              Microsoft Entra mode has been selected, but this phase only
              exposes a safe setup-needed boundary until real sign-in is added.
            </span>
          </div>
        )}

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.id}
              aria-current={item.id === activeView ? "page" : undefined}
              href={`#${item.id}`}
              className={
                item.id === activeView ? "nav-item active" : "nav-item"
              }
              onClick={() => onSelectView(item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {isPreviewAuth ? (
          <div className="demo-notice" role="note">
            <strong>Demo data only.</strong> No Microsoft Graph or live Teams
            Shifts data is connected yet.
          </div>
        ) : (
          <div className="demo-notice" role="note">
            <strong>Setup required.</strong> Microsoft Entra auth is still
            stubbed. No Microsoft Graph or live Teams Shifts data is connected
            yet.
          </div>
        )}
      </div>

      <div className="status-card">
        {isPreviewAuth ? (
          <>
            <strong>{currentUser.name}</strong>
            <span>
              {currentUser.role === "manager" ? "Manager" : "Staff member"}
            </span>
            <span>{currentUserDepartmentLabel}</span>
            <span>Preview/demo mode</span>
          </>
        ) : (
          <>
            <strong>{auth.mode}</strong>
            <span>{auth.message ?? "Microsoft auth is not configured yet."}</span>
            <span>
              {teamsRuntime.context?.hostName ?? "Microsoft Teams"} ready for a
              future sign-in path
            </span>
            <span>
              {teamsRuntime.context?.clientType
                ? `Client: ${teamsRuntime.context.clientType}`
                : "No Teams client required today"}
            </span>
          </>
        )}
      </div>
    </aside>
  );
}
