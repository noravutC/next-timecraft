import { useId } from 'react';
import { cn } from '@/lib/utils';
import { BOARD_TEMPLATES } from '@/helper/default-project';
import { TemplateCard } from './template-card';

/** "Template" field: radio grid of the six board templates. */
export const TemplatePicker = ({
  value,
  onChange,
  layout = 'dialog',
}: {
  value: string;
  onChange: (templateId: string) => void;
  /** dialog: 2 columns · page: up to 3 columns with taller previews */
  layout?: 'dialog' | 'page';
}) => {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm leading-5 font-medium text-ink">
        Template
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={cn(
          'grid gap-2.5',
          layout === 'dialog'
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        )}
      >
        {BOARD_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={template.id === value}
            previewSize={layout === 'dialog' ? 'md' : 'lg'}
            onSelect={() => onChange(template.id)}
          />
        ))}
      </div>
    </div>
  );
};
