'use client';

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Briefcase,
  ChevronDown,
  Layers,
  Lock,
  Shield,
  Siren,
  Target,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ProjectRole } from '@/types';

// ─── Hardcoded options ──────────────────────────────────────────────────────

const ICON_OPTIONS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'layers', icon: Layers, label: 'Layers' },
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'siren', icon: Siren, label: 'Siren' },
  { id: 'target', icon: Target, label: 'Target' },
  { id: 'lock', icon: Lock, label: 'Lock' },
  { id: 'briefcase', icon: Briefcase, label: 'Briefcase' },
];

const COLOR_OPTIONS = [
  { id: 'blue', value: '#3b82f6' },
  { id: 'teal', value: '#14b8a6' },
  { id: 'sky', value: '#7dd3fc' },
  { id: 'rose', value: '#fda4af' },
  { id: 'violet', value: '#a78bfa' },
  { id: 'slate', value: '#cbd5e1' },
  { id: 'emerald', value: '#86efac' },
  { id: 'navy', value: '#1e293b' },
];

type DefaultAccess = Exclude<ProjectRole, 'owner'>;
const DEFAULT_ACCESS_OPTIONS: { id: DefaultAccess; label: string }[] = [
  { id: 'viewer', label: 'Viewer' },
  { id: 'editor', label: 'Editor' },
  { id: 'admin', label: 'Admin' },
];

// ─── localStorage helpers (icon / color / defaultAccess are UI-only) ────────

type LocalPrefs = {
  icon: string;
  color: string;
  defaultAccess: DefaultAccess;
};

const DEFAULT_PREFS: LocalPrefs = {
  icon: 'shield',
  color: '#3b82f6',
  defaultAccess: 'editor',
};

const prefsKey = (projectId: string) => `board-prefs:${projectId}`;

const readPrefs = (projectId: string): LocalPrefs => {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(prefsKey(projectId));
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as LocalPrefs;
  } catch {
    return DEFAULT_PREFS;
  }
};

const writePrefs = (projectId: string, prefs: LocalPrefs) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(prefsKey(projectId), JSON.stringify(prefs));
  } catch {
    /* swallow */
  }
};

// ─── Section accordion ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  hint?: string;
  icon: LucideIcon;
  iconClass?: string;
  defaultOpen?: boolean;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}

const Section = ({
  title,
  hint,
  icon: Icon,
  iconClass,
  defaultOpen,
  tone = 'default',
  children,
}: SectionProps) => (
  <details
    className="group border-b border-border/70 last:border-b-0"
    open={defaultOpen}
  >
    <summary
      className={cn(
        'flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 transition-colors hover:bg-muted/40',
        tone === 'danger' && 'text-destructive',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md border bg-background',
          iconClass,
          tone === 'danger' && 'border-destructive/30 bg-destructive/5',
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight">{title}</p>
        {hint && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
    <div className="space-y-3 px-4 pb-4">{children}</div>
  </details>
);

// ─── Field label ────────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
    {children}
  </p>
);

// ─── Main panel ─────────────────────────────────────────────────────────────

export const BoardSettingsPanel = () => {
  const { projectIsUsing, projects, updateProject, deleteProject } =
    useProjectStore();
  const { users } = useUserStore();
  const { setView } = useNavStore();

  const project = projectIsUsing ? projects[projectIsUsing] : null;

  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Select a project to view its settings.
      </div>
    );
  }

  return (
    <BoardSettingsContent
      key={project.id}
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description ?? ''}
      projectTags={project.tags ?? []}
      projectMembers={project.members ?? []}
      projectOwnerId={project.ownerId}
      projectArchived={project.archived}
      users={users}
      updateProject={updateProject}
      deleteProject={deleteProject}
      onClose={() => setView('board')}
    />
  );
};

// ─── Inner stateful content (key'd per project) ─────────────────────────────

interface ContentProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectTags: string[];
  projectMembers: { userId: string; role: ProjectRole; joinedAt: Date }[];
  projectOwnerId: string;
  projectArchived: boolean;
  users: ReturnType<typeof useUserStore.getState>['users'];
  updateProject: ReturnType<
    typeof useProjectStore.getState
  >['updateProject'];
  deleteProject: ReturnType<
    typeof useProjectStore.getState
  >['deleteProject'];
  onClose: () => void;
}

const BoardSettingsContent = ({
  projectId,
  projectName,
  projectDescription,
  projectTags,
  projectMembers,
  projectOwnerId,
  projectArchived,
  users,
  updateProject,
  deleteProject,
  onClose,
}: ContentProps) => {
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);
  const [tags, setTags] = useState<string[]>(projectTags);
  const [draftTag, setDraftTag] = useState('');
  const [prefs, setPrefs] = useState<LocalPrefs>(() => readPrefs(projectId));
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Re-sync local prefs when project switches
  useEffect(() => {
    setPrefs(readPrefs(projectId));
  }, [projectId]);

  const updatePrefs = (next: Partial<LocalPrefs>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      writePrefs(projectId, merged);
      return merged;
    });
  };

  const persistName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === projectName) {
      setName(projectName);
      return;
    }
    try {
      await updateProject(projectId, { name: trimmed });
      toast.success('Board name updated');
    } catch {
      toast.error('Unable to update board name');
      setName(projectName);
    }
  };

  const persistDescription = async () => {
    const trimmed = description.trim();
    if (trimmed === projectDescription) return;
    try {
      await updateProject(projectId, { description: trimmed });
      toast.success('Description updated');
    } catch {
      toast.error('Unable to update description');
      setDescription(projectDescription);
    }
  };

  const addTag = async () => {
    const next = draftTag.trim();
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      toast.error('This tag already exists');
      return;
    }
    const updated = [...tags, next];
    setTags(updated);
    setDraftTag('');
    try {
      await updateProject(projectId, { tags: updated });
    } catch {
      toast.error('Unable to add tag');
      setTags(tags);
    }
  };

  const removeTag = async (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    setTags(updated);
    try {
      await updateProject(projectId, { tags: updated });
    } catch {
      toast.error('Unable to remove tag');
      setTags(tags);
    }
  };

  const handleArchive = async () => {
    setConfirmArchive(false);
    try {
      await updateProject(projectId, { archived: !projectArchived });
      toast.success(projectArchived ? 'Board unarchived' : 'Board archived');
    } catch {
      toast.error('Unable to update archive state');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success('Board deleted');
      setConfirmDelete(false);
      onClose();
    } catch {
      toast.error('Unable to delete board');
    } finally {
      setDeleting(false);
    }
  };

  const memberHint = useMemo(() => {
    const count = projectMembers.length;
    return `${count} member${count === 1 ? '' : 's'} · Team can ${prefs.defaultAccess === 'viewer' ? 'view' : prefs.defaultAccess === 'admin' ? 'admin' : 'edit'}`;
  }, [projectMembers.length, prefs.defaultAccess]);

  const SelectedIcon =
    ICON_OPTIONS.find((o) => o.id === prefs.icon)?.icon ?? Shield;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
          style={{ backgroundColor: prefs.color }}
        >
          <SelectedIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Board settings
          </p>
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {projectName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Sections */}
      <div className="scrollbar-thin-y scrollbar-gray min-h-0 flex-1 overflow-y-auto">
        {/* General */}
        <Section
          title="General"
          hint="Name, description, icon, color"
          icon={SelectedIcon}
          iconClass="text-white border-transparent"
          defaultOpen
        >
          <div className="space-y-1.5">
            <FieldLabel>Board name</FieldLabel>
            <Input
              inputSize="sm"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              onBlur={persistName}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="GuardianFlow"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={persistDescription}
              placeholder="What is this board tracking?"
              className="min-h-20 resize-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Icon</FieldLabel>
            <div className="grid grid-cols-6 gap-1.5">
              {ICON_OPTIONS.map((option) => {
                const isActive = prefs.icon === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updatePrefs({ icon: option.id })}
                    aria-label={option.label}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md border bg-background transition-all',
                      isActive
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <Icon className="size-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Accent color</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((option) => {
                const isActive = prefs.color === option.value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updatePrefs({ color: option.value })}
                    aria-label={option.id}
                    className={cn(
                      'size-6 rounded-full border-2 transition-all',
                      isActive
                        ? 'border-foreground ring-2 ring-primary/20'
                        : 'border-transparent ring-1 ring-border hover:ring-foreground/30',
                    )}
                    style={{ backgroundColor: option.value }}
                  />
                );
              })}
            </div>
          </div>
        </Section>

        {/* Tags */}
        <Section
          title="Tags"
          hint={
            tags.length === 0
              ? 'No tags yet'
              : `${tags.length} tag${tags.length === 1 ? '' : 's'}`
          }
          icon={Layers}
        >
          <div className="space-y-1.5">
            <FieldLabel>Add tag</FieldLabel>
            <div className="flex gap-1.5">
              <Input
                inputSize="sm"
                value={draftTag}
                onChange={(e) => setDraftTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Bug, Design, ..."
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex min-h-12 flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2.5">
            {tags.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Add a few labels for faster triage.
              </p>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <span>{tag}</span>
                  <X className="size-3 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </Section>

        {/* Members & permissions */}
        <Section
          title="Members & permissions"
          hint={memberHint}
          icon={Users}
        >
          <div className="space-y-2">
            <FieldLabel>Members ({projectMembers.length})</FieldLabel>
            <div className="space-y-1">
              {projectMembers.map((member) => {
                const user = users[member.userId];
                const displayName = user?.fullName ?? 'Loading…';
                const initial = displayName.charAt(0).toUpperCase();
                const isOwner = member.userId === projectOwnerId;
                const roleLabel = isOwner
                  ? 'Owner'
                  : member.role.charAt(0).toUpperCase() +
                    member.role.slice(1);
                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2.5 rounded-md border bg-background px-2.5 py-1.5"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={user?.avatar ?? undefined} />
                      <AvatarFallback className="text-[11px] font-semibold">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {displayName}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 text-[11px]',
                        isOwner
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {roleLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-1.5 border-dashed text-xs"
            onClick={() => toast.info('Member invites coming soon')}
          >
            <UserPlus className="size-3.5" />
            Invite member
          </Button>

          <div className="space-y-1.5">
            <FieldLabel>Default access</FieldLabel>
            <div className="grid grid-cols-3 gap-0.5 rounded-md border bg-muted/30 p-0.5">
              {DEFAULT_ACCESS_OPTIONS.map((option) => {
                const isActive = prefs.defaultAccess === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updatePrefs({ defaultAccess: option.id })}
                    className={cn(
                      'rounded px-2 py-1 text-[11px] font-medium transition-all',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          title="Danger zone"
          hint="Archive or delete this board"
          icon={TriangleAlert}
          tone="danger"
        >
          <p className="text-[11px] text-muted-foreground">
            Archiving hides this board from everyone but owners. Deleting
            removes all cards permanently.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-destructive/40 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setConfirmArchive(true)}
          >
            {projectArchived ? 'Unarchive board' : 'Archive board'}
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full bg-destructive text-xs text-white hover:bg-destructive/90"
            onClick={() => setConfirmDelete(true)}
          >
            Delete board
          </Button>
        </Section>
      </div>

      {/* Archive confirm */}
      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectArchived ? 'Unarchive board?' : 'Archive board?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {projectArchived
                ? 'This board will become active again.'
                : 'This board will be hidden from everyone but owners. You can unarchive it anytime.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {projectArchived ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              All columns and cards in <strong>{projectName}</strong> will be
              removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete board'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
