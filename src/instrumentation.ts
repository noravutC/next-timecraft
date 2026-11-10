import * as Sentry from "@sentry/nextjs";

// Both are off by default: Sentry needs SENTRY_DSN, OpenTelemetry export
// needs OTEL_EXPORTER_OTLP_ENDPOINT. Without them nothing initializes and
// the app behaves exactly as before.
export async function register() {
  // the OpenTelemetry SDK is Node only
  const otel =
    process.env.NEXT_RUNTIME === "nodejs"
      ? await import("@/lib/telemetry/otel")
      : null;
  const exportSpans = otel?.otlpEnabled ?? false;

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      // Sentry sets up the tracer provider; the sampled spans go to both
      openTelemetrySpanProcessors:
        otel && exportSpans ? [otel.otlpSpanProcessor()] : [],
    });
  } else if (otel && exportSpans) {
    otel.startTracing();
  }

  if (otel && exportSpans) otel.startMetrics();
}

export const onRequestError = Sentry.captureRequestError;
