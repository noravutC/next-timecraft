import { LayoutTemplate, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectSettings } from '@/types/project-settings';
import type { BoardColumn, TemplateCardView } from './automation-operations';
import type { PeopleById } from './rule-parts';
import { TemplateCard } from './template-card';

/** The board's task templates as cards, or a way to make the first one. */
export const TemplatesSection = ({
  cards,
  people,
  tagColors,
  columns,
  canEdit,
  canUse,
  onOpen,
  onUse,
  onNew,
}: {
  cards: TemplateCardView[];
  people: PeopleById;
  tagColors: Required<ProjectSettings>['tagColors'];
  columns: BoardColumn[];
  canEdit: boolean;
  canUse: boolean;
  onOpen: (templateId: string) => void;
  onUse: (templateId: string, columnId: string) => void;
  onNew: () => void;
}) => {
  if (cards.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-line bg-background px-6 py-18 text-center">
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"
        >
          <LayoutTemplate className="size-5" />
        </span>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
          No templates yet
        </h2>
        <p className="max-w-110 text-base leading-5.5 text-ink-muted">
          A template is a task you can reuse: its title, description, labels,
          subtasks and who it goes to. Make one here, or save any task as one
          from its menu.
        </p>
        {canEdit && (
          <Button onClick={onNew} className="mt-2">
            <Plus />
            New template
          </Button>
        )}
      </section>
    );
  }
  return (
    <>
      <p className="max-w-240 text-sm leading-5 text-ink-muted">
        A template is a task you can reuse: its title, description, labels,
        subtasks and who it goes to. Any task can be saved as one from its menu.
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(18.75rem,100%),1fr))] gap-3">
        {cards.map((card) => (
          <TemplateCard
            key={card.id}
            card={card}
            people={people}
            tagColors={tagColors}
            columns={columns}
            canUse={canUse}
            onOpen={onOpen}
            onUse={onUse}
          />
        ))}
      </ul>
    </>
  );
};
