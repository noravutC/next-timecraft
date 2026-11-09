'use client';

import { TriangleAlert } from 'lucide-react';
import type { AiSettingsStatus } from '@/app/api/ai/settings/route';
import { AiBreakdownProviderCard } from './ai-breakdown-provider-card';
import { PROVIDER_ORDER } from './ai-breakdown-providers';

export const AiBreakdownSettings = ({
  settings,
  isGuest,
  onSaved,
}: {
  settings: AiSettingsStatus;
  isGuest: boolean;
  onSaved: (next: AiSettingsStatus) => void;
}) => (
  <div className="flex flex-col gap-3.5">
    <p className="text-sm leading-5 text-ink-subtle">
      Connect a provider to power AI Breakdown. Keys are stored encrypted on the
      server and only used for your own requests.
    </p>
    {isGuest && (
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-soft px-3 py-2.5 text-sm leading-5 text-warning-text"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Guest accounts can&rsquo;t store API keys. Sign in with Google to add
          your own.
        </span>
      </div>
    )}
    {PROVIDER_ORDER.map((provider) => (
      <AiBreakdownProviderCard
        key={provider}
        provider={provider}
        settings={settings}
        disabled={isGuest}
        onSaved={onSaved}
      />
    ))}
  </div>
);
