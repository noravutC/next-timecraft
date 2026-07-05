import pino from "pino";

// Structured JSON logs on stdout — docker/CloudWatch/grep friendly.
// LOG_LEVEL: fatal | error | warn | info (default) | debug | trace
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined, // drop pid/hostname noise
  timestamp: pino.stdTimeFunctions.isoTime,
});
