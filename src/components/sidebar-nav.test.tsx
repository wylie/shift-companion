import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppSidebar } from "./AppSidebar";
import type { AppAuthSession, CurrentUser, PreviewUser, TeamsRuntimeState } from "../types";

const auth: AppAuthSession = {
  message: "Preview mode",
  mode: "browserPreview",
  providerId: "preview-demo",
  status: "authenticated",
};

const currentUser: CurrentUser = {
  id: "user-staff-1",
  organizationId: "org-demo-1",
  name: "Jordan Lee",
  role: "staff",
  teamIds: ["wellness"],
  isDemo: true,
};

const previewUsers: PreviewUser[] = [
  {
    id: "user-staff-1",
    name: "Jordan Lee",
    role: "staff",
    teamIds: ["wellness"],
    isDemo: true,
    departmentNames: ["Wellness"],
  },
];

const teamsRuntime: TeamsRuntimeState = {
  context: undefined,
  errorMessage: undefined,
  mode: "browserPreview",
  sso: {
    errorMessage: undefined,
    status: "idle",
    token: undefined,
  },
};

describe("AppSidebar", () => {
  it("renders exactly two primary navigation items", () => {
    const markup = renderToStaticMarkup(
      <AppSidebar
        activeView="schedule"
        auth={auth}
        currentUser={currentUser}
        currentUserDepartmentLabel="Wellness"
        mockUsers={previewUsers}
        navItems={[
          { id: "schedule", label: "Schedule & Calendar" },
          { id: "settings", label: "Settings & Feedback" },
        ]}
        onSelectView={() => undefined}
        onUserChange={() => undefined}
        teamsRuntime={teamsRuntime}
      />,
    );

    expect(markup).toContain("Schedule &amp; Calendar");
    expect(markup).toContain("Settings &amp; Feedback");
    expect(markup).not.toContain("My Unavailability");
    expect(markup).not.toContain(">Calendar<");
    expect(markup).not.toContain(">Feedback<");
  });
});
