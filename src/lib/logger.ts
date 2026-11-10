import { trace } from "@opentelemetry/api";
import pino from "pino";

// Structured JSON logs on stdout — docker/CloudWatch/grep friendly.
// LOG_LEVEL: fatal | error | warn | info (default) | debug | trace
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined, // drop pid/hostname noise
  timestamp: pino.stdTimeFunctions.isoTime,
  // inside a traced request, every line carries the trace it belongs to
  mixin() {
    const span = trace.getActiveSpan()?.spanContext();
    return span ? { traceId: span.traceId, spanId: span.spanId } : {};
  },
});
