import { createHmac } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { isAccepted } from '@/helper/utils/webhook';
import {
  allowInsecureWebhooks,
  guardedLookup,
  isBlockedAddress,
} from './webhook-guard';

/** How long a receiver has to answer. */
export const WEBHOOK_TIMEOUT_MS = 10_000;

export type SendResult = {
  /** the receiver's status code; null when it never answered */
  status: number | null;
  durationMs: number;
  error: string | null;
};

/** `sha256=<hex>`: the body signed with the webhook's secret. */
export const signBody = (secret: string, body: string): string =>
  `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

const reason = (err: NodeJS.ErrnoException): string => {
  if (err.code === 'EWEBHOOKBLOCKED') return err.message;
  if (err.code === 'ETIMEDOUT') return 'No answer in 10 seconds';
  if (err.code === 'ENOTFOUND') return 'The address was not found';
  if (err.code === 'ECONNREFUSED') return 'The connection was refused';
  return 'Could not connect';
};

/**
 * POSTs one message. Never throws: whatever happened comes back as a
 * result. Redirects are not followed, so a receiver cannot point the
 * request somewhere else.
 */
export function postWebhook(
  url: string,
  body: string,
  headers: Record<string, string>,
): Promise<SendResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const done = (status: number | null, error: string | null) =>
      resolve({ status, durationMs: Date.now() - started, error });
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return done(null, 'That is not a web address');
    }
    const insecure = target.protocol === 'http:';
    if (insecure && !allowInsecureWebhooks()) {
      return done(null, 'The address must start with https://');
    }
    // an address written as numbers is never looked up, so it is checked here
    const host = target.hostname.replace(/^\[|\]$/g, '');
    if (
      isIP(host) !== 0 &&
      isBlockedAddress(host) &&
      !allowInsecureWebhooks()
    ) {
      return done(null, 'This address leads to a private network');
    }
    const request = (insecure ? http : https).request(
      target,
      {
        method: 'POST',
        lookup: guardedLookup,
        timeout: WEBHOOK_TIMEOUT_MS,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'TimeCraft-Webhooks/1',
        },
      },
      (response) => {
        // the answer's body is not kept: only whether it was accepted
        response.resume();
        response.on('end', () => {
          const status = response.statusCode ?? null;
          done(
            status,
            isAccepted(status)
              ? null
              : `${status ?? ''} ${response.statusMessage ?? ''}`.trim(),
          );
        });
      },
    );
    request.on('timeout', () => {
      request.destroy(
        Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }),
      );
    });
    request.on('error', (err: NodeJS.ErrnoException) =>
      done(null, reason(err)),
    );
    request.end(body);
  });
}
