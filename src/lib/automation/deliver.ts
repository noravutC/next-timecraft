import {
  claimDeliveries,
  finishDelivery,
} from '@/db/uniq-query/automation/webhook-utils';
import { isAccepted, nextAttemptAt } from '@/helper/utils/webhook';
import { decryptSecret } from '@/lib/ai/crypto';
import { logger } from '@/lib/logger';
import { recordWebhookTry } from '@/lib/telemetry/metrics';
import { postWebhook, signBody } from './webhook-send';

/** Messages sent side by side in one go. */
const BATCH = 25;

/**
 * Sends the messages whose time has come, or only the ones just written
 * when `ids` is given. A message that is not accepted waits for its next
 * try; after the last one it is marked failed.
 */
export async function deliverWebhooks(
  now: Date = new Date(),
  ids?: string[],
): Promise<number> {
  const claimed = await claimDeliveries(now, BATCH, ids);
  await Promise.all(
    claimed.map(async ({ delivery, webhook }) => {
      try {
        if (!webhook.enabled) {
          await finishDelivery(delivery.id, {
            status: 'failed',
            responseStatus: null,
            durationMs: null,
            error: 'The webhook was turned off',
          });
          return;
        }
        const body = JSON.stringify(delivery.payload);
        const result = await postWebhook(webhook.url, body, {
          'X-TimeCraft-Event': delivery.event,
          'X-TimeCraft-Delivery': delivery.id,
          'X-TimeCraft-Signature': signBody(
            decryptSecret(webhook.secret),
            body,
          ),
        });
        const accepted = isAccepted(result.status);
        const next = accepted ? null : nextAttemptAt(delivery.attempts, now);
        const status = accepted ? 'sent' : next ? 'pending' : 'failed';
        await finishDelivery(delivery.id, {
          status,
          responseStatus: result.status,
          durationMs: result.durationMs,
          error: accepted ? null : result.error,
          ...(next ? { nextAttemptAt: next } : {}),
        });
        recordWebhookTry(
          status === 'sent'
            ? 'sent'
            : status === 'pending'
              ? 'retry'
              : 'failed',
        );
      } catch (err) {
        // it stays claimed and is offered again when the claim runs out
        logger.error({ err, deliveryId: delivery.id }, 'webhook send failed');
      }
    }),
  );
  return claimed.length;
}
