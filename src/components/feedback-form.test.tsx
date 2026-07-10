import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackCenter } from "./FeedbackCenter";

describe("FeedbackCenter", () => {
  it("renders the combined feedback form fields when feedback email is configured", () => {
    const markup = renderToStaticMarkup(
      <FeedbackCenter
        appVersion="0.3.0"
        currentUserName="Jordan Lee"
        feedbackEmail="feedback@example.com"
      />,
    );

    expect(markup).toContain("Help improve the companion");
    expect(markup).toContain("Category");
    expect(markup).toContain("Message");
    expect(markup).toContain("Contact email");
    expect(markup).toContain("Open feedback draft");
  });
});
