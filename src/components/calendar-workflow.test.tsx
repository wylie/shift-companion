import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalendarExport } from "./CalendarExport";
import { MySchedule } from "./MySchedule";
import type { CurrentUser } from "../types";

const currentUser: CurrentUser = {
  id: "user-staff-1",
  organizationId: "org-demo-1",
  name: "Jordan Lee",
  role: "staff",
  teamIds: ["dept-wellness"],
  isDemo: true,
};

describe("calendar page workflow", () => {
  it("keeps download, subscription, setup, and privacy sections on Calendar", () => {
    const markup = renderToStaticMarkup(
      <CalendarExport currentUser={currentUser} />,
    );

    expect(markup).toContain("Download calendar (.ics)");
    expect(markup).toContain("Subscribe to calendar");
    expect(markup).toContain("Loading subscription status");
    expect(markup).toContain("Setup guidance");
    expect(markup).toContain("Apple Calendar");
    expect(markup).toContain("Google Calendar");
    expect(markup).toContain("Outlook");
    expect(markup).toContain("Privacy notes");
  });

  it("keeps My Schedule focused on viewing shifts and linking to Calendar", () => {
    const markup = renderToStaticMarkup(
      <MySchedule currentUser={currentUser} onNavigate={() => undefined} />,
    );

    expect(markup).toContain("See what you&#x27;re working");
    expect(markup).toContain("Manage calendar");
    expect(markup).not.toContain("Personal schedule export");
    expect(markup).not.toContain("Download calendar (.ics)");
    expect(markup).not.toContain(">Feedback<");
  });
});
