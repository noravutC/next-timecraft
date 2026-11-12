import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRIGGER_ICONS } from './automation-icons';
import type { RuleIdea } from './automation-operations';

/** Ready-made rules beside the list: each opens filled in, to change or save. */
export const RuleIdeas = ({
  ideas,
  onUse,
}: {
  ideas: RuleIdea[];
  onUse: (idea: RuleIdea) => void;
}) => (
  <section
    aria-label="Ideas to start with"
    className="flex min-w-0 grow basis-80 flex-col gap-2"
  >
    <h2 className="text-xs font-medium text-ink-subtle">Ideas to start with</h2>
    <div className="flex flex-col rounded-xl border border-line bg-background p-2">
      <ul className="flex flex-col">
        {ideas.map((idea) => {
          const Icon = TRIGGER_ICONS[idea.icon];
          return (
            <li key={idea.key}>
              <Button
                variant="ghost"
                size={null}
                onClick={() => onUse(idea)}
                className="h-auto min-h-12 w-full justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left font-normal whitespace-normal text-ink"
              >
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-hover text-ink-muted"
                >
                  <Icon className="size-3.75" />
                </span>
                <span className="min-w-0 flex-1 text-sm">{idea.title}</span>
                <Plus aria-hidden className="size-3.75 text-ink-subtle" />
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mx-2 mt-1 mb-1.5 border-t border-line-soft pt-2.5 text-xs leading-4.5 text-ink-subtle">
        Each one opens filled in. Change anything before you save it.
      </p>
    </div>
  </section>
);
