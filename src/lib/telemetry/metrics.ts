import { metrics, type Counter, type Histogram } from '@opentelemetry/api';

// Instruments are made on first use: a meter taken before
// src/instrumentation.ts has registered the provider would record nothing.
// With no OTLP endpoint they are no-ops.
const meter = () => metrics.getMeter('timecraft');

let requestDuration: Histogram | undefined;

/** One API request, in seconds (the OpenTelemetry HTTP convention). */
export function recordApiRequest(
  method: string,
  route: string,
  status: number,
  durationMs: number,
) {
  requestDuration ??= meter().createHistogram('http.server.request.duration', {
    unit: 's',
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5,
        10,
      ],
    },
  });
  requestDuration.record(durationMs / 1000, {
    'http.request.method': method,
    'http.route': route,
    'http.response.status_code': status,
  });
}

export const WEB_VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

const vitals = new Map<WebVitalName, Histogram>();

const vitalHistogram = (name: WebVitalName) => {
  let histogram = vitals.get(name);
  if (!histogram) {
    histogram = meter().createHistogram(
      `web_vitals.${name.toLowerCase()}`,
      // CLS is a unitless score well under 1; the rest are milliseconds
      name === 'CLS'
        ? {
            advice: {
              explicitBucketBoundaries: [
                0.01, 0.025, 0.05, 0.1, 0.15, 0.25, 0.5, 1,
              ],
            },
          }
        : { unit: 'ms' },
    );
    vitals.set(name, histogram);
  }
  return histogram;
};

/** A Core Web Vital measured in a visitor's browser. */
export function recordWebVital(
  name: WebVitalName,
  value: number,
  page: string,
  rating: string,
) {
  vitalHistogram(name).record(value, { page, rating });
}

let ruleRuns: Counter | undefined;

/** A rule that ran: how it ended, and what started it. */
export function recordRuleRun(status: string, trigger: string) {
  ruleRuns ??= meter().createCounter('automation.rule.runs');
  ruleRuns.add(1, { status, trigger });
}

let webhookTries: Counter | undefined;

/** One try at sending a webhook message: accepted, retrying or given up. */
export function recordWebhookTry(outcome: 'sent' | 'retry' | 'failed') {
  webhookTries ??= meter().createCounter('automation.webhook.tries');
  webhookTries.add(1, { outcome });
}
