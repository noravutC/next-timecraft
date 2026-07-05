import * as Sentry from "@sentry/nextjs";

// Sentry is DSN-gated: without SENTRY_DSN nothing initializes and the app
// behaves exactly as before. Source-map upload (withSentryConfig) is
// deliberately not wired — it needs a SENTRY_AUTH_TOKEN at build time.
export async function register() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
