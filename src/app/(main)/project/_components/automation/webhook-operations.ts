import { isAccepted, webhookUrlProblem } from '@/helper/utils/webhook';
import type { Webhook, WebhookEvent } from '@/types';

/** A webhook while it is being written. */
export type WebhookDraft = {
  name: string;
  url: string;
  events: WebhookEvent[];
};

export const emptyWebhook: WebhookDraft = {
  name: '',
  url: '',
  events: ['task.created', 'task.finished'],
};

export const draftOfWebhook = (webhook: Webhook): WebhookDraft => ({
  name: webhook.name,
  url: webhook.url,
  events: webhook.events,
});

export const toggleEvent = (
  events: WebhookEvent[],
  event: WebhookEvent,
): WebhookEvent[] =>
  events.includes(event)
    ? events.filter((e) => e !== event)
    : [...events, event];

/** Why the webhook cannot be saved yet; null when it can. */
export const webhookProblem = (draft: WebhookDraft): string | null => {
  if (!draft.name.trim()) return 'Give the webhook a name';
  if (!draft.url.trim()) return 'Say where to send it';
  const problem = webhookUrlProblem(draft.url.trim());
  // http is allowed by the server only when it is set up for local testing
  if (problem && !draft.url.trim().startsWith('http://')) return problem;
  if (draft.events.length === 0) return 'Pick at least one thing to send';
  return null;
};

/** "Accepted: 200 in 182 ms", or what went wrong in a few words. */
export const testText = (result: {
  status: number | null;
  durationMs: number;
  error: string | null;
}): { ok: boolean; text: string } =>
  isAccepted(result.status)
    ? {
        ok: true,
        text: `Accepted: ${result.status} in ${result.durationMs} ms`,
      }
    : {
        ok: false,
        text: `Not accepted: ${result.error ?? result.status ?? 'no answer'}`,
      };

/** What a request looks like, for whoever writes the receiver. */
export const WEBHOOK_SAMPLE = `POST /your-endpoint
X-TimeCraft-Event: task.finished
X-TimeCraft-Delivery: 7f3a09c2-…
X-TimeCraft-Signature: sha256=9f2c…

{
  "event": "task.finished",
  "sentAt": "2026-11-12T03:00:00.000Z",
  "board": { "id": "…", "name": "Website Relaunch" },
  "task": {
    "id": "…",
    "title": "Build images on GitHub Actions",
    "column": "Done",
    "priority": "low",
    "dueDate": null,
    "labels": ["Infra"],
    "url": "https://…"
  },
  "change": "moved this from Review to Done",
  "actor": { "name": "Noravut C." }
}`;

/** A fresh signing secret: 24 random bytes, shown once to whoever adds the webhook. */
export const newSecret = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const base64 = btoa(String.fromCharCode(...bytes));
  return `whsec_${base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
};
