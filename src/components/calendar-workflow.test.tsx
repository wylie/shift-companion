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

describe("schedule and calendar workflow", () => {
  it("keeps download, subscription, setup, and privacy sections in calendar management", () => {
    const markup = renderToStaticMarkup(
      <CalendarExport currentUser={currentUser} />,
    );

    expect(markup).toContain("Download calendar (.ics)");
    expect(markup).toContain("Calendar subscription");
    expect(markup).toContain("Loading subscription status");
    expect(markup).toContain("Calendar apps");
    expect(markup).toContain("Apple Calendar");
    expect(markup).toContain("Google Calendar");
    expect(markup).toContain("Outlook");
    expect(markup).toContain("Privacy");
  });

  it("keeps the schedule section focused on viewing shifts and linking to calendar management", () => {
    const markup = renderToStaticMarkup(
      <MySchedule currentUser={currentUser} />,
    );

    expect(markup).toContain("<h2>Schedule</h2>");
    expect(markup).not.toContain("Personal schedule export");
    expect(markup).not.toContain("Download calendar (.ics)");
    expect(markup).not.toContain(">Feedback<");
  });
});
