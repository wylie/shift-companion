import { describe, expect, it } from "vitest";
import { isTeamsInitializationErrorSafeToTreatAsBrowserPreview } from "./teams";

describe("Teams runtime helpers", () => {
  it("treats no-parent-window initialization failures as browser preview", () => {
    expect(
      isTeamsInitializationErrorSafeToTreatAsBrowserPreview(
        new Error("Initialization Failed. No Parent window found."),
      ),
    ).toBe(true);
  });

  it("keeps unexpected Teams initialization failures distinct", () => {
    expect(
      isTeamsInitializationErrorSafeToTreatAsBrowserPreview(
        new Error("Host timed out while resolving Teams context."),
      ),
    ).toBe(false);
  });
});
