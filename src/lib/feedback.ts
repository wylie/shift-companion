export function buildFeedbackHref(params: {
  appVersion: string;
  currentUserName: string;
  feedbackEmail: string;
  type: "bug" | "feature";
}) {
  const subject =
    params.type === "feature"
      ? `Feature request for Teams Shifts Companion v${params.appVersion}`
      : `Bug report for Teams Shifts Companion v${params.appVersion}`;
  const body =
    params.type === "feature"
      ? [
          "What should change?",
          "",
          "Why would it make your schedule easier to access?",
          "",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n")
      : [
          "What happened?",
          "",
          "What did you expect to happen?",
          "",
          "How can this be reproduced?",
          "",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n");

  return `mailto:${params.feedbackEmail}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
