'use client';

import { Sparkles, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Textarea } from '@/components/ui/textarea';
import {
  MODEL_OPTIONS,
  PROVIDERS,
  type Provider,
} from './ai-breakdown-providers';
import { AiBreakdownResults } from './ai-breakdown-results';
import { AiBreakdownTargetSelect } from './ai-breakdown-target-select';
import type { BoardColumnLike, BreakdownResult } from './use-ai-breakdown';

interface GenerateProps {
  columns: BoardColumnLike[];
  target: BoardColumnLike;
  onTargetChange: (columnId: string) => void;
  goal: string;
  onGoalChange: (goal: string) => void;
  provider: Provider;
  onProviderChange: (provider: Provider) => void;
  /** guests run on the shared Claude key and can't switch */
  modelLocked: boolean;
  /** AI settings not loaded yet */
  settingsLoading: boolean;
  needsKey: boolean;
  onOpenSettings: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  result: BreakdownResult | null;
  onViewBoard: () => void;
}

export const AiBreakdownGenerate = (props: GenerateProps) => (
  <div className="flex flex-col gap-4.5">
    <div className="flex flex-col gap-2">
      <label
        htmlFor="ai-goal"
        className="text-sm leading-5 font-medium text-ink"
      >
        What do you want to build?
      </label>
      <Textarea
        id="ai-goal"
        rows={4}
        value={props.goal}
        onChange={(e) => props.onGoalChange(e.target.value)}
        disabled={props.isGenerating}
        placeholder="e.g. Set up SSO login with Okta, including provisioning, tests, and docs"
        className="min-h-26.75 resize-none rounded-lg px-3 py-2.5"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <span className="text-sm leading-5 font-medium text-ink">Model</span>
        <fieldset
          disabled={
            props.modelLocked || props.settingsLoading || props.isGenerating
          }
          className={cn(props.modelLocked && 'opacity-60')}
        >
          <SegmentedControl
            aria-label="Model"
            fill
            options={MODEL_OPTIONS}
            value={props.provider}
            onChange={props.onProviderChange}
            optionClassName="h-7.5"
          />
        </fieldset>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm leading-5 font-medium text-ink">Add to</span>
        <AiBreakdownTargetSelect
          columns={props.columns}
          target={props.target}
          onSelect={props.onTargetChange}
          disabled={props.isGenerating}
        />
      </div>
    </div>

    {props.modelLocked && (
      <p className="-mt-2 text-xs text-ink-subtle">
        Guest accounts use the shared Claude key.
      </p>
    )}

    {props.needsKey && (
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-soft px-3 py-2.5 text-sm leading-5 text-warning-text"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span className="flex-1">
          No API key for {PROVIDERS[props.provider].label} yet.{' '}
          <Button
            variant="link"
            size={null}
            onClick={props.onOpenSettings}
            className="inline font-semibold text-warning-text underline"
          >
            Add one in Settings
          </Button>
        </span>
      </div>
    )}

    {/* while generating it stays solid (busy), like the kit's Saving… button */}
    <Button
      onClick={props.onGenerate}
      disabled={!props.canGenerate && !props.isGenerating}
      aria-busy={props.isGenerating}
      className={cn(
        'h-9.5 w-full gap-2 text-base',
        props.isGenerating && 'pointer-events-none',
      )}
    >
      {props.isGenerating ? (
        <>
          <Loader size="xs" onColor />
          Generating…
        </>
      ) : (
        <>
          <Sparkles className="size-3.75" />
          Generate tasks
        </>
      )}
    </Button>

    {props.result && (
      <AiBreakdownResults
        result={props.result}
        generating={props.isGenerating}
        onViewBoard={props.onViewBoard}
      />
    )}
  </div>
);
