'use client';

import { useReportWebVitals } from 'next/web-vitals';

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

// Defined once, outside the component: a new function reference would make
// Next report every metric again.
const sendVital = (metric: Metric) => {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: window.location.pathname,
  });
  // sendBeacon still delivers while the page is being closed, which is when
  // LCP, CLS and INP settle
  navigator.sendBeacon(
    '/api/vitals',
    new Blob([body], { type: 'application/json' }),
  );
};

/** Reports Core Web Vitals from the visitor's browser. Renders nothing. */
export function WebVitalsReporter() {
  useReportWebVitals(sendVital);
  return null;
}
