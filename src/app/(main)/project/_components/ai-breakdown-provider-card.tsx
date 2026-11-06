'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { aiServices } from '@/services/ai.service';
import type { AiSettingsStatus } from '@/app/api/ai/settings/route';
import {
  PROVIDERS,
  hasProviderKey,
  type Provider,
} from './ai-breakdown-providers';

interface ProviderCardProps {
  provider: Provider;
  settings: AiSettingsStatus;
  /** guests can't store keys; the card is read-only for them */
  disabled: boolean;
  onSaved: (next: AiSettingsStatus) => void;
}

export const AiBreakdownProviderCard = ({
  provider,
  settings,
  disabled,
  onSaved,
}: ProviderCardProps) => {
  const meta = PROVIDERS[provider];
  const hasKey = hasProviderKey(settings, provider);
  const inputId = `ai-key-${provider}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasDraft = apiKey.trim().length > 0;

  const [isRemoving, setIsRemoving] = useState(false);
  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const { updated } = await aiServices.updateSettings(
        provider === 'claude' ? { claudeApiKey: null } : { geminiApiKey: null },
      );
      if (updated) onSaved(updated);
      toast.success(`${meta.label} key removed`);
    } catch (error) {
      console.error('Remove AI key failed:', error);
      toast.error(`Couldn’t remove the ${meta.label} key`);
    } finally {
      setIsRemoving(false);
    }
  };
  // without your key: TimeCraft's shared Claude key if the server has one
  const afterRemoval =
    provider === 'claude' && settings.hasServerFallback
      ? 'Removing it switches you back to TimeCraft’s key and its daily limit.'
      : `Removing it turns ${meta.label} off until you add a key again.`;

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    // nothing typed yet: point the user at the field instead of a dead click
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { updated } = await aiServices.updateSettings({
        provider: settings.provider,
        ...(provider === 'claude'
          ? { claudeApiKey: trimmed }
          : { geminiApiKey: trimmed }),
      });
      if (updated) onSaved(updated);
      setApiKey('');
      toast.success(`${meta.label} key saved`);
    } catch (error) {
      console.error('Save AI key failed:', error);
      toast.error(`Failed to save ${meta.label} key`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-popover border border-line p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-medium text-ink">{meta.label}</span>
          <span className="font-mono text-2xs leading-5 text-ink-subtle">
            {meta.vendor} · {meta.model}
          </span>
        </span>
        {hasKey ? (
          <Badge variant="success">
            <span className="size-1.5 rounded-full bg-success" />
            Saved
          </Badge>
        ) : (
          <Badge variant="outline">Not set</Badge>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-xs leading-5 text-ink-muted">
          API key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              id={inputId}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasKey
                  ? '•••••••• saved, enter a new key to replace'
                  : meta.placeholder
              }
              autoComplete="off"
              disabled={disabled}
              className={cn('h-8.5 px-3', hasDraft && 'pr-9')}
            />
            {hasDraft && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 text-ink-subtle"
              >
                {showKey ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
            )}
          </div>
          <Button
            variant={hasKey ? 'outline' : 'default'}
            onClick={() => void handleSave()}
            disabled={disabled || isSaving}
            className="px-3"
          >
            {isSaving ? <Loader size="xs" onColor={!hasKey} /> : 'Save key'}
          </Button>
        </div>
        {provider === 'claude' && settings.hasServerFallback && !hasKey && (
          <p className="text-xs text-ink-subtle">
            A shared server key is available. Saving your own key overrides it.
          </p>
        )}
      </div>

      {hasKey && !disabled && (
        <div className="flex items-center gap-3 border-t border-line-soft pt-3">
          <p className="flex-1 text-xs leading-5 text-ink-subtle">
            {afterRemoval}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRemove()}
            disabled={isRemoving}
            className="shrink-0 border-danger-line text-danger-text hover:border-danger-line hover:bg-danger-soft hover:text-danger-text"
          >
            {isRemoving ? 'Removing…' : 'Remove key'}
          </Button>
        </div>
      )}
    </div>
  );
};
