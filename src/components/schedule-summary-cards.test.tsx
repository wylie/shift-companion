import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScheduleSummaryCards } from "./ScheduleSummaryCards";
import type { Shift } from "../types";

function createShift(
  id: string,
  title: string,
  start: string,
  end: string,
  location: string,
): Shift {
  return {
    id,
    userId: "user-staff-1",
    title,
    start,
    end,
    location,
  };
}

describe("ScheduleSummaryCards", () => {
  it("renders a loading state instead of a false empty state", () => {
    const markup = renderToStaticMarkup(
      <ScheduleSummaryCards
        errorMessage={null}
        isLoading
        now={new Date("2026-07-10T09:00:00")}
        shifts={[]}
      />,
    );

    expect(markup).toContain("Loading schedule...");
    expect(markup).not.toContain("No shifts today.");
    expect(markup).not.toContain("No upcoming shifts.");
  });

  it("renders no-data text instead of blank cards", () => {
    const markup = renderToStaticMarkup(
      <ScheduleSummaryCards
        errorMessage={null}
        isLoading={false}
        now={new Date("2026-07-10T09:00:00")}
        shifts={[]}
      />,
    );

    expect(markup).toContain("No shifts today.");
    expect(markup).toContain("No upcoming shifts.");
  });

  it("renders today's shifts and the next shift from the same schedule data", () => {
    const shifts = [
      createShift(
        "shift-1",
        "Wellness Attendant",
        "2026-07-10T09:00:00",
        "2026-07-10T13:00:00",
        "Wellness Center",
      ),
      createShift(
        "shift-2",
        "Front Desk Coverage",
        "2026-07-10T15:00:00",
        "2026-07-10T19:00:00",
        "Front Desk",
      ),
    ];

    const markup = renderToStaticMarkup(
      <ScheduleSummaryCards
        errorMessage={null}
        isLoading={false}
        now={new Date("2026-07-10T13:30:00")}
        shifts={shifts}
      />,
    );

    expect(markup).toContain("Wellness Attendant");
    expect(markup).toContain("Front Desk Coverage");
    expect(markup).toContain("3:00 PM-7:00 PM");
    expect(markup).toContain("Front Desk");
  });

  it("updates the rendered summary when a different preview user's schedule is supplied", () => {
    const jordanMarkup = renderToStaticMarkup(
      <ScheduleSummaryCards
        errorMessage={null}
        isLoading={false}
        now={new Date("2026-07-10T08:00:00")}
        shifts={[
          createShift(
            "shift-1",
            "Wellness Attendant",
            "2026-07-10T09:00:00",
            "2026-07-10T13:00:00",
            "Wellness Center",
          ),
        ]}
      />,
    );
    const taylorMarkup = renderToStaticMarkup(
      <ScheduleSummaryCards
        errorMessage={null}
        isLoading={false}
        now={new Date("2026-07-10T08:00:00")}
        shifts={[
          createShift(
            "shift-2",
            "Membership Support",
            "2026-07-11T10:00:00",
            "2026-07-11T14:00:00",
            "Member Services",
          ),
        ]}
      />,
    );

    expect(jordanMarkup).toContain("Wellness Attendant");
    expect(taylorMarkup).not.toContain("Wellness Attendant");
    expect(taylorMarkup).toContain("Membership Support");
  });
});
