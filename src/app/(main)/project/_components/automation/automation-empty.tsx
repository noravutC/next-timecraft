import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRIGGER_ICONS } from './automation-icons';
import type { RuleIdea } from './automation-operations';

/** In place of the list on a board with no rules yet; fills the page. */
export const AutomationEmpty = ({
  ideas,
  canManage,
  onIdea,
  onNew,
}: {
  ideas: RuleIdea[];
  canManage: boolean;
  onIdea: (idea: RuleIdea) => void;
  onNew: () => void;
}) => (
  <section className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl border border-line bg-background px-5 py-12">
    <div className="flex max-w-120 flex-col items-center gap-2.5 text-center">
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"
      >
        <Zap className="size-5" />
      </span>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
        Let the board do the routine work
      </h2>
      <p className="text-base leading-5.5 text-ink-muted">
        {canManage
          ? 'A rule waits for something to happen on this board, then acts for you. Start with one of these, or build your own.'
          : 'A rule waits for something to happen on this board, then acts for you. Owners and admins of the board can add them.'}
      </p>
    </div>
    {canManage && (
      <>
        <ul className="grid w-full max-w-220 grid-cols-[repeat(auto-fit,minmax(min(16.25rem,100%),1fr))] gap-2.5">
          {ideas.map((idea) => {
            const Icon = TRIGGER_ICONS[idea.icon];
            return (
              <li key={idea.key} className="flex">
                <Button
                  variant="outline"
                  size={null}
                  onClick={() => onIdea(idea)}
                  className="h-auto min-h-15 w-full justify-start gap-2.5 rounded-lg px-3 py-2.5 text-left whitespace-normal"
                >
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-hover text-ink-muted"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {idea.title}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
        <Button onClick={onNew}>
          <Plus />
          Build a rule from scratch
        </Button>
      </>
    )}
  </section>
);
