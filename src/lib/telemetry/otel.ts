import { context, metrics, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
  BatchSpanProcessor,
  TracerProvider,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace';

// Node runtime only (loaded from src/instrumentation.ts). Everything here is
// off until OTEL_EXPORTER_OTLP_ENDPOINT is set; the exporters read that and
// OTEL_EXPORTER_OTLP_HEADERS themselves, so any OTLP backend works.
export const otlpEnabled = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

const resource = resourceFromAttributes({
  'service.name': process.env.OTEL_SERVICE_NAME ?? 'timecraft',
  'deployment.environment.name': process.env.NODE_ENV,
});

/** Sends finished spans to the OTLP endpoint, in batches. */
export const otlpSpanProcessor = (): SpanProcessor =>
  new BatchSpanProcessor({ exporter: new OTLPTraceExporter() });

/**
 * Tracing without Sentry. With a SENTRY_DSN, Sentry owns the tracer
 * provider and takes otlpSpanProcessor() as an extra processor instead:
 * two providers can't both be the global one.
 */
export function startTracing() {
  context.setGlobalContextManager(
    new AsyncLocalStorageContextManager().enable(),
  );
  trace.setGlobalTracerProvider(
    new TracerProvider({ resource, spanProcessors: [otlpSpanProcessor()] }),
  );
}

export function startMetrics() {
  metrics.setGlobalMeterProvider(
    new MeterProvider({
      resource,
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter(),
        }),
      ],
    }),
  );
}
