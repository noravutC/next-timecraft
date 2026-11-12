'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SegmentedControl,
  type SegmentedOption,
} from '@/components/ui/segmented-control';
import { BoardViewSwitch } from '../board-view-switch';
import type { AutomationSection } from './automation-operations';

const SECTIONS: { value: AutomationSection; label: string }[] = [
  { value: 'rules', label: 'Rules' },
  { value: 'templates', label: 'Templates' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'history', label: 'History' },
];

/** The Automation toolbar: view, section, and the section's "new" button. */
export const AutomationToolbar = ({
  section,
  onSection,
  counts,
  primary,
}: {
  section: AutomationSection;
  onSection: (section: AutomationSection) => void;
  /** how many rules, templates and webhooks; none shown while loading */
  counts: Partial<Record<AutomationSection, number>>;
  /** null when this person cannot add one, or the section has nothing to add */
  primary: { label: string; onClick: () => void } | null;
}) => {
  const options: SegmentedOption<AutomationSection>[] = SECTIONS.map(
    ({ value, label }) => ({
      value,
      label: (
        <span className="flex items-center gap-1.5">
          {label}
          {counts[value] !== undefined && (
            <>
              {/* read as "Rules 8", not "Rules8" */}{' '}
              <span className="text-xs text-ink-subtle">{counts[value]}</span>
            </>
          )}
        </span>
      ),
    }),
  );
  return (
    <div className="flex min-h-13 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5 py-2.25">
      <BoardViewSwitch />
      <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
      <SegmentedControl
        aria-label="Automation section"
        options={options}
        value={section}
        onChange={onSection}
        optionClassName="max-sm:px-2.5"
      />
      <div className="flex-1" />
      {primary && (
        <Button size="sm" onClick={primary.onClick}>
          <Plus />
          {primary.label}
        </Button>
      )}
    </div>
  );
};
