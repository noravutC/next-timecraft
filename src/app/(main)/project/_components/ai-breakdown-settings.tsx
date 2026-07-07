'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Sparkle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { aiServices } from '@/services/ai.service';
import type { AiSettingsStatus } from '@/app/api/ai/settings/route';

type Provider = 'claude' | 'gemini';

const PROVIDER_META: Record<
  Provider,
  {
    label: string;
    sub: string;
    placeholder: string;
    icon: typeof Sparkles;
    tile: string;
  }
> = {
  claude: {
    label: 'Claude',
    sub: 'Anthropic · claude-opus-4-8',
    placeholder: 'sk-ant-...',
    icon: Sparkle,
    tile: 'bg-emerald-100 text-emerald-700',
  },
  gemini: {
    label: 'Gemini',
    sub: 'Google · gemini-2.5-flash',
    placeholder: 'AIza...',
    icon: Sparkles,
    tile: 'bg-brand-soft text-brand',
  },
};

const ProviderCard = ({
  provider,
  settings,
  onSaved,
}: {
  provider: Provider;
  settings: AiSettingsStatus;
  onSaved: (next: AiSettingsStatus) => void;
}) => {
  const meta = PROVIDER_META[provider];
  const hasKey =
    provider === 'claude' ? settings.hasClaudeKey : settings.hasGeminiKey;

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed || isSaving) return;
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
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            meta.tile,
          )}
        >
          <meta.icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{meta.label}</p>
          <p className="truncate text-xs text-ink-subtle">{meta.sub}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
            hasKey
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-surface text-ink-subtle',
          )}
        >
          {hasKey ? 'Saved' : 'Not set'}
        </span>
      </div>

      <p className="mt-3 mb-1.5 text-xs font-semibold text-ink-muted">
        API Key
      </p>
      <div className="relative">
        <Input
          inputSize="md"
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            hasKey ? '•••••••• (saved — enter to replace)' : meta.placeholder
          }
          autoComplete="off"
          className="rounded-lg border-line bg-surface pr-9 font-mono text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          aria-label={showKey ? 'Hide key' : 'Show key'}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-ink-faint hover:text-ink"
        >
          {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {provider === 'claude' && settings.hasServerFallback && !hasKey && (
        <p className="mt-2 text-xs text-ink-subtle">
          Server&rsquo;s shared Claude key is available — saving your own key
          overrides it.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleSave()}
        disabled={!apiKey.trim() || isSaving}
        className="mt-3 rounded-lg"
      >
        {isSaving ? <Loader size="xs" /> : 'Save key'}
      </Button>
    </div>
  );
};

export const AiBreakdownSettings = ({
  settings,
  onSaved,
}: {
  settings: AiSettingsStatus;
  onSaved: (next: AiSettingsStatus) => void;
}) => (
  <div className="flex flex-col gap-4">
    <p className="text-sm leading-relaxed text-ink-muted">
      Connect a provider to power AI breakdown. Keys are stored encrypted on
      the server and only used for your own requests.
    </p>
    {(['claude', 'gemini'] as Provider[]).map((provider) => (
      <ProviderCard
        key={provider}
        provider={provider}
        settings={settings}
        onSaved={onSaved}
      />
    ))}
    <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-xs text-ink-subtle">
      <Lock className="size-3.5 shrink-0" />
      Keys are encrypted at rest and never exposed back to the browser.
    </div>
  </div>
);
