'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SettingsActionBar,
  SettingsCard,
  withToastSave,
} from './settings-action-bar';

// ─── TagHint ─────────────────────────────────────────────────────────────────

const TagHint = ({ title, description }: { title: string; description: string }) => (
  <div>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

const tagHints = [
  {
    title: 'Use teams or work types',
    description: 'Examples: Backend, Design, QA, Research.',
  },
  {
    title: 'Avoid long tag names',
    description: 'Short labels stay readable even on compact task cards.',
  },
  {
    title: 'Keep the list intentional',
    description: 'Too many labels make triage slower instead of easier.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface TagsSettingsSectionProps {
  projectId: string;
  initialTags: string[];
  saving: boolean;
  onSave: (projectId: string, payload: { tags?: string[] }) => Promise<void>;
}

export const TagsSettingsSection = ({
  projectId,
  initialTags,
  onSave,
  saving,
}: TagsSettingsSectionProps) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draftTag, setDraftTag] = useState('');

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const hasChanges =
    JSON.stringify([...tags].sort()) !== JSON.stringify([...initialTags].sort());

  const addTag = () => {
    const next = draftTag.trim();
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      toast.error('This tag already exists');
      return;
    }
    setTags((prev) => [...prev, next]);
    setDraftTag('');
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = () =>
    withToastSave(
      () => onSave(projectId, { tags }),
      'Tags updated',
      'Unable to update tags',
    );

  const handleReset = () => {
    setTags(initialTags);
    setDraftTag('');
  };

  return (
    <div className="space-y-6">
      <SettingsActionBar
        changed={hasChanges}
        saving={saving}
        onReset={handleReset}
        onSave={handleSave}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SettingsCard>
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Board labels</CardTitle>
            <CardDescription>
              Keep labels short and meaningful so they stay readable on cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                inputSize="md"
                value={draftTag}
                onChange={(e) => setDraftTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag such as Bug or Design"
              />
              <Button type="button" onClick={addTag}>
                Add tag
              </Button>
            </div>

            <div className="flex min-h-36 flex-wrap gap-2 rounded-2xl border bg-background p-4">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags yet. Add a few common labels for faster triage.
                </p>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => removeTag(tag)}
                  >
                    <span>{tag}</span>
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </SettingsCard>

        <SettingsCard>
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Guidance</CardTitle>
            <CardDescription>
              Consistent labels make filtering and scanning much faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {tagHints.map((hint, index) => (
              <div key={hint.title}>
                <TagHint title={hint.title} description={hint.description} />
                {index < tagHints.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </SettingsCard>
      </div>
    </div>
  );
};
