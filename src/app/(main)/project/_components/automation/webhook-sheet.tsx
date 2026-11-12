'use client';

import { Check, Copy, Send, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { WEBHOOK_EVENTS } from '@/helper/utils/automation';
import type { WebhookTestResult } from '@/services/automation.service';
import {
  testText,
  toggleEvent,
  webhookProblem,
  type WebhookDraft,
} from './webhook-operations';

/**
 * A webhook being added or changed. A new one shows its signing secret
 * here, once. Mounted fresh for each webhook it opens.
 */
export const WebhookSheet = ({
  webhookId,
  initial,
  secret,
  onClose,
  onSave,
  onDelete,
  onTest,
}: {
  /** null for a webhook that is not saved yet */
  webhookId: string | null;
  initial: WebhookDraft;
  /** the new webhook's secret; null when editing a saved one */
  secret: string | null;
  onClose: () => void;
  onSave: (draft: WebhookDraft) => Promise<void>;
  onDelete: () => void;
  onTest: (draft: WebhookDraft) => Promise<WebhookTestResult>;
}) => {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [tested, setTested] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const problem = webhookProblem(draft);
  const set = (patch: Partial<WebhookDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    if (problem) return;
    setBusy('save');
    try {
      await onSave(draft);
    } finally {
      setBusy(null);
    }
  };
  const test = async () => {
    setBusy('test');
    setTested(null);
    try {
      setTested(testText(await onTest(draft)));
    } catch (error) {
      setTested({
        ok: false,
        text: (error as { message?: string })?.message ?? 'The test failed',
      });
    } finally {
      setBusy(null);
    }
  };
  const copySecret = () => {
    if (!secret) return;
    void navigator.clipboard.writeText(secret).then(
      () => toast.success('Secret copied'),
      () => toast.error('Could not copy it'),
    );
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="gap-0 sm:max-w-140">
        <header className="flex h-13 shrink-0 items-center border-b border-line pr-14 pl-5">
          <SheetTitle className="text-base font-semibold">
            {webhookId ? 'Edit webhook' : 'Add a webhook'}
          </SheetTitle>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="webhook-name">Name</Label>
            <Input
              id="webhook-name"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Team chat"
              maxLength={80}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="webhook-url">Send to</Label>
            <Input
              id="webhook-url"
              type="url"
              value={draft.url}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="https://"
              maxLength={2000}
              aria-describedby="webhook-url-hint"
              className="h-9 font-mono text-xs"
            />
            <span id="webhook-url-hint" className="text-xs text-ink-subtle">
              An address that starts with https://
            </span>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 text-sm font-medium text-ink">
              Send it when
            </legend>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(13.75rem,100%),1fr))] gap-x-3 gap-y-1">
              {WEBHOOK_EVENTS.map(({ event, label }) => (
                <label
                  key={event}
                  className="flex h-8 cursor-pointer items-center gap-2.5 text-sm text-ink"
                >
                  <Checkbox
                    checked={draft.events.includes(event)}
                    onCheckedChange={() =>
                      set({ events: toggleEvent(draft.events, event) })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Signing secret</span>
            {secret ? (
              <>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface pr-1 pl-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                    {secret}
                  </span>
                  <Button variant="ghost" size="xs" onClick={copySecret}>
                    <Copy className="size-3.25" />
                    Copy
                  </Button>
                </div>
                <span className="text-xs leading-4.5 text-ink-subtle">
                  Shown once, here. The receiver uses it to check each request
                  really came from this board.
                </span>
              </>
            ) : (
              <span className="text-xs leading-4.5 text-ink-subtle">
                It was shown once, when this webhook was added. To get a new
                one, delete this webhook and add it again.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line-soft bg-surface p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={test}
              disabled={busy !== null || !draft.url.trim()}
            >
              <Send className="size-3.5" />
              Send a test
            </Button>
            <span
              role="status"
              className="inline-flex min-w-0 items-center gap-1.5 text-sm"
            >
              {busy === 'test' && (
                <span className="text-ink-subtle">Sending…</span>
              )}
              {tested &&
                (tested.ok ? (
                  <span className="inline-flex items-center gap-1.5 text-success-text">
                    <Check aria-hidden className="size-3.5" />
                    {tested.text}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-danger-text">
                    <TriangleAlert aria-hidden className="size-3.5" />
                    {tested.text}
                  </span>
                ))}
            </span>
          </div>
          {webhookId && (
            <p className="-mt-3 text-xs leading-4.5 text-ink-subtle">
              A test goes to the address as it was last saved.
            </p>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-3">
          {webhookId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="-ml-2.5 text-danger-text hover:text-danger-text"
            >
              Delete webhook
            </Button>
          )}
          <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-subtle">
            {problem}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={Boolean(problem) || busy !== null}
            onClick={save}
          >
            {webhookId ? 'Save webhook' : 'Add webhook'}
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
};
