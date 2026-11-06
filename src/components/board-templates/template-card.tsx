import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BoardTemplate } from '@/helper/default-project';
import { TemplatePreview } from './template-preview';

/** Selectable template: mini board preview, name, tagline and column count. */
export const TemplateCard = ({
  template,
  selected,
  previewSize,
  onSelect,
}: {
  template: BoardTemplate;
  selected: boolean;
  previewSize?: 'md' | 'lg';
  onSelect: () => void;
}) => (
  <Button
    type="button"
    variant="outline"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      'relative h-auto flex-col items-stretch justify-start gap-2.5 rounded-popover border-line p-3 text-left font-normal whitespace-normal hover:bg-background',
      selected && 'border-ink ring-1 ring-ink hover:border-ink',
    )}
  >
    <TemplatePreview columns={template.columns} size={previewSize} />
    <span className="flex flex-col gap-px pr-5">
      <span className="text-base font-medium text-ink">{template.name}</span>
      <span className="text-xs leading-5 text-ink-subtle">
        {template.tagline} · {template.columns.length} columns
      </span>
    </span>
    {selected && (
      <span className="absolute right-3 bottom-3.5 grid size-4.5 place-items-center rounded-full bg-ink">
        <Check className="size-2.75 stroke-3 text-white" />
      </span>
    )}
  </Button>
);
