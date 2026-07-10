import type { AppConfig } from "../../config";
import type { FeedbackProvider, FeedbackProviderStatus } from "../types";

function getFeedbackProviderStatus(config: AppConfig): FeedbackProviderStatus {
  if (!config.feedbackEmail) {
    return {
      availability: "not_configured",
      capabilities: ["emailFeedback"],
      configured: false,
      enabled: false,
      message:
        "Feedback email is not configured. Settings can still render, but feedback links stay disabled until FEEDBACK_EMAIL is set.",
      name: "EmailFeedbackProvider",
      providerId: "feedback-email",
      version: "0.3.0",
    };
  }

  return {
    availability: "available",
    capabilities: ["configured", "emailFeedback"],
    configured: true,
    enabled: true,
    message:
      "Feedback uses the configured support email address and stays intentionally lightweight.",
    name: "EmailFeedbackProvider",
    providerId: "feedback-email",
    version: "0.3.0",
  };
}

export function createEmailFeedbackProvider(config: AppConfig): FeedbackProvider {
  return {
    getFeedbackEmail() {
      return config.feedbackEmail;
    },
    async getProviderStatus() {
      return getFeedbackProviderStatus(config);
    },
  };
}
