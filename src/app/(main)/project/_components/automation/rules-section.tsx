import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectSettings } from '@/types/project-settings';
import type { RuleIdea, RuleRowView } from './automation-operations';
import { RuleIdeas } from './rule-ideas';
import type { PeopleById } from './rule-parts';
import { RuleRow } from './rule-row';

/** The Rules list: a line on the week, the rules in two groups, and ideas. */
export const RulesSection = ({
  summary,
  groups,
  ideas,
  people,
  tagColors,
  canManage,
  onOpen,
  onToggle,
  onDelete,
  onIdea,
  onBroken,
}: {
  summary: { text: string; broken: string | null };
  groups: { caption: string; rows: RuleRowView[] }[];
  ideas: RuleIdea[];
  people: PeopleById;
  tagColors: Required<ProjectSettings>['tagColors'];
  canManage: boolean;
  onOpen: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
  onDelete: (ruleId: string) => void;
  onIdea: (idea: RuleIdea) => void;
  /** to History, showing only what went wrong */
  onBroken: () => void;
}) => (
  <>
    <p className="flex items-start gap-2.5 rounded-xl bg-brand-soft px-4 py-3 text-base text-ink">
      <Zap aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
      <span>
        <span className="font-semibold">This week so far:</span> {summary.text}
        {summary.broken && (
          <>
            {' '}
            <Button
              variant="link"
              size={null}
              onClick={onBroken}
              className="h-auto p-0 text-base font-medium underline"
            >
              {summary.broken}
            </Button>
            .
          </>
        )}
      </span>
    </p>
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 grow-3 basis-155 flex-col gap-4">
        {groups.map((group) => (
          <section
            key={group.caption}
            aria-label={group.caption}
            className="flex flex-col gap-2"
          >
            <h2 className="text-xs font-medium text-ink-subtle">
              {group.caption}
            </h2>
            <ul className="flex flex-col rounded-xl border border-line bg-background p-1">
              {group.rows.map((row) => (
                <RuleRow
                  key={row.id}
                  row={row}
                  people={people}
                  tagColors={tagColors}
                  canManage={canManage}
                  onOpen={onOpen}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {canManage && ideas.length > 0 && (
        <RuleIdeas ideas={ideas} onUse={onIdea} />
      )}
    </div>
  </>
);
