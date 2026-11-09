import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

// Zod checks whether it may compile parsers (`Function("")`) the first time
// it parses an object. The CSP allows no eval, so in the browser that check
// is a logged violation; jitless skips it and parses the same way.
z.config({ jitless: true });

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
