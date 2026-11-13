import { Lock, Plus, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WebhookRowView } from './automation-operations';
import { WEBHOOK_SAMPLE } from './webhook-operations';
import { WebhookRow } from './webhook-row';

const CARD =
  'flex flex-col items-center justify-center gap-2.5 rounded-xl border border-line bg-background px-6 py-14 text-center';

/** The board's webhooks beside what a message looks like. */
export const WebhooksSection = ({
  rows,
  canManage,
  allowed,
  onOpen,
  onToggle,
  onDelete,
  onFailed,
  onNew,
}: {
  rows: WebhookRowView[];
  canManage: boolean;
  /** off in the shared guest workspace */
  allowed: boolean;
  onOpen: (webhookId: string) => void;
  onToggle: (webhookId: string, enabled: boolean) => void;
  onDelete: (webhookId: string) => void;
  onFailed: () => void;
  onNew: () => void;
}) => (
  <div className="flex flex-wrap items-start gap-4">
    <section
      aria-label="Webhooks"
      className="flex min-w-0 grow-3 basis-155 flex-col gap-2"
    >
      <h2 className="text-xs font-medium text-ink-subtle">
        Where this board sends news
      </h2>
      {!canManage || !allowed ? (
        <div className={CARD}>
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink-muted"
          >
            <Lock className="size-4.5" />
          </span>
          <p className="max-w-110 text-base leading-5.5 text-ink-muted">
            {canManage
              ? 'Webhooks are off in the guest workspace, which everyone shares. Sign in with Google to send a board’s news to another app.'
              : 'Only owners and admins of the board can see and change its webhooks: an address can carry a password.'}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className={CARD}>
          <span
            aria-hidden
            className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"
          >
            <Webhook className="size-5" />
          </span>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
            No webhooks yet
          </h3>
          <p className="max-w-110 text-base leading-5.5 text-ink-muted">
            A webhook tells another app whenever something happens on this
            board: a chat, a status page, a script of your own.
          </p>
          <Button onClick={onNew} className="mt-2">
            <Plus />
            Add webhook
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col rounded-xl border border-line bg-background p-1">
          {rows.map((row) => (
            <WebhookRow
              key={row.id}
              row={row}
              onOpen={onOpen}
              onToggle={onToggle}
              onDelete={onDelete}
              onFailed={onFailed}
            />
          ))}
        </ul>
      )}
    </section>

    <section
      aria-label="What gets sent"
      className="flex min-w-0 grow basis-80 flex-col gap-2"
    >
      <h2 className="text-xs font-medium text-ink-subtle">What gets sent</h2>
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-background p-4">
        <p className="text-sm leading-5 text-ink-muted">
          One request for each thing that happens, signed with the webhook’s
          secret so the receiver can check it came from TimeCraft.
        </p>
        <pre
          tabIndex={0}
          aria-label="An example request"
          className="overflow-x-auto rounded-lg border border-line-soft bg-surface p-3 font-mono text-xs leading-4.5 text-ink"
        >
          {WEBHOOK_SAMPLE}
        </pre>
        <p className="text-xs leading-4.5 text-ink-subtle">
          The signature is the HMAC-SHA256 of the request body. If the receiver
          does not answer with a 2xx, the message is sent again: 5 tries in all,
          over about half a day.
        </p>
      </div>
    </section>
  </div>
);
