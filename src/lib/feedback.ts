export function buildFeedbackHref(params: {
  appVersion: string;
  contactEmail?: string;
  currentUserName: string;
  feedbackEmail: string;
  message?: string;
  type: "bug" | "feature";
}) {
  const subject =
    params.type === "feature"
      ? `Feature request for Teams Shifts Companion v${params.appVersion}`
      : `Bug report for Teams Shifts Companion v${params.appVersion}`;
  const body =
    params.type === "feature"
      ? [
          params.message?.trim() || "What should change?",
          "",
          "Why would it make your schedule easier to access?",
          "",
          params.contactEmail
            ? `Reply-to contact: ${params.contactEmail}`
            : "Reply-to contact: not provided",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n")
      : [
          params.message?.trim() || "What happened?",
          "",
          "What did you expect to happen?",
          "",
          "How can this be reproduced?",
          "",
          params.contactEmail
            ? `Reply-to contact: ${params.contactEmail}`
            : "Reply-to contact: not provided",
          `Current app version: ${params.appVersion}`,
          `Current app user: ${params.currentUserName}`,
        ].join("\n");

  return `mailto:${params.feedbackEmail}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
