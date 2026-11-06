import type { AiSettingsStatus } from '@/app/api/ai/settings/route';

export type Provider = AiSettingsStatus['provider'];

export const PROVIDER_ORDER: Provider[] = ['claude', 'gemini'];

/**
 * What the sheet shows per provider. Model ids mirror AI_MODELS in
 * src/lib/ai/providers.ts, which is server-only (it imports the SDKs).
 */
export const PROVIDERS: Record<
  Provider,
  { label: string; vendor: string; model: string; placeholder: string }
> = {
  claude: {
    label: 'Claude',
    vendor: 'Anthropic',
    model: 'claude-opus-4-8',
    placeholder: 'sk-ant-…',
  },
  gemini: {
    label: 'Gemini',
    vendor: 'Google',
    model: 'gemini-2.5-flash',
    placeholder: 'AIza…',
  },
};

/** Options for the Model segmented control. */
export const MODEL_OPTIONS = PROVIDER_ORDER.map((value) => ({
  value,
  label: PROVIDERS[value].label,
}));

export const hasProviderKey = (
  settings: AiSettingsStatus,
  provider: Provider,
): boolean =>
  provider === 'claude' ? settings.hasClaudeKey : settings.hasGeminiKey;

/**
 * Can this provider run right now? Claude falls back to the server key;
 * Gemini needs the user's own. Guests never use stored keys (the account is
 * shared), so for them only the server key counts.
 */
export const isProviderReady = (
  settings: AiSettingsStatus,
  provider: Provider,
  isGuest: boolean,
): boolean => {
  if (isGuest) return provider === 'claude' && settings.hasServerFallback;
  return provider === 'claude'
    ? settings.hasClaudeKey || settings.hasServerFallback
    : settings.hasGeminiKey;
};
