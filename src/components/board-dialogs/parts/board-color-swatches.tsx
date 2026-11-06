'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ACCENT_COLORS } from '@/lib/project-settings/constants';
import type { Tone } from '@/helper/utils/avatar-tone';

// pastel fill + a dot in the tone's dark color (the dot is bg-current)
const SWATCH_STYLES: Record<Tone, string> = {
  violet:
    'bg-tone-violet text-tone-violet-fg hover:bg-tone-violet hover:text-tone-violet-fg',
  blue: 'bg-tone-blue text-tone-blue-fg hover:bg-tone-blue hover:text-tone-blue-fg',
  green:
    'bg-tone-green text-tone-green-fg hover:bg-tone-green hover:text-tone-green-fg',
  orange:
    'bg-tone-orange text-tone-orange-fg hover:bg-tone-orange hover:text-tone-orange-fg',
  red: 'bg-tone-red text-tone-red-fg hover:bg-tone-red hover:text-tone-red-fg',
  pink: 'bg-tone-pink text-tone-pink-fg hover:bg-tone-pink hover:text-tone-pink-fg',
  cyan: 'bg-tone-cyan text-tone-cyan-fg hover:bg-tone-cyan hover:text-tone-cyan-fg',
  slate:
    'bg-tone-slate text-tone-slate-fg hover:bg-tone-slate hover:text-tone-slate-fg',
};

/** Board color: eight round swatches; the board tile takes this tone. */
export const BoardColorSwatches = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (accent: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span
      id="board-color-label"
      className="text-sm leading-5 font-medium text-ink"
    >
      Color
    </span>
    <div
      role="radiogroup"
      aria-labelledby="board-color-label"
      className="flex flex-wrap gap-2"
    >
      {ACCENT_COLORS.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'size-7 rounded-full p-0',
              SWATCH_STYLES[option.tone],
              selected
                ? 'ring-2 ring-ink ring-offset-2 ring-offset-background'
                : 'ring-1 ring-black/6 ring-inset',
            )}
          >
            <span className="size-2.5 rounded-full bg-current" />
          </Button>
        );
      })}
    </div>
  </div>
);
