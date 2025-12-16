// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e4223cea1dc9350b721d74a639a847f9@o4510546341068800.ingest.us.sentry.io/4510546357190656",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // User Feedback Widget Configuration
  integrations: [
    Sentry.feedbackIntegration({
      colorScheme: "system",
      formTitle: "Share Your Feedback",
      submitButtonLabel: "Send Feedback",
      cancelButtonLabel: "Cancel",
      messagePlaceholder:
        "What's on your mind? Bug reports, suggestions, or questions welcome!",
      successMessageText: "Thanks! Your feedback has been submitted.",
      isNameRequired: false,
      isEmailRequired: false,
      enableScreenshot: true,
      autoInject: true,
      triggerLabel: "Feedback",
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Session Replay sample rates
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
